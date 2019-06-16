import { ExtensionContext, commands } from "vscode";
import { getApi, Role, SharedService, SharedServiceProxy, View } from "vsls";

import { CountTreeDataProvider } from "./treeDataProvider";
import {
  INCREMENT_COUNT_NOTIFICATION,
  SERVICE_NAME,
  INCREMENT_COUNT_COMMAND,
  GET_COUNT_REQUEST
} from "./constants";

import { store } from "./store";

export async function activate(context: ExtensionContext) {
  // Get access to the Live Share API. Since this extension
  // takes a "hard dependency" on Live Share, we can guaruntee,
  // that this API would always be available. Otherwise,
  // we could check check for null, which indicates the end-user
  // doesn't have Live Share installed alongside your extension.
  const vsls = (await getApi())!;

  let service: SharedService | SharedServiceProxy | null;

  // Register the custom tree provider with Live Share, which
  // allows you to augment it however you'd like to.
  const treeDataProvider = new CountTreeDataProvider(store);
  vsls.registerTreeDataProvider(View.Session, treeDataProvider);

  context.subscriptions.push(
    commands.registerCommand(INCREMENT_COUNT_COMMAND, () => {
      store.increment();
      service!.notify(INCREMENT_COUNT_NOTIFICATION, {
        peerNumber: vsls.session.peerNumber
      });
    })
  );

  // This event will fire whenever an end-user joins
  // or leaves a sessionn, either of the host or guest.
  vsls.onDidChangeSession(async e => {
    if (e.session.role === Role.Host) {
      store.count = 0;

      service = await vsls.shareService(SERVICE_NAME);
      service!.onRequest(GET_COUNT_REQUEST, () => {
        return store.count;
      });

      service!.onNotify(INCREMENT_COUNT_NOTIFICATION, e => {
        store.increment();

        // Re-broadcast the notification to all other guests.
        service!.notify(INCREMENT_COUNT_NOTIFICATION, e);
      });
    } else if (e.session.role === Role.Guest) {
      service = await vsls.getSharedService(SERVICE_NAME);
      if (!service) {
        return;
      }

      // Grab the current count from the host, who is the 
      // "source of truth" for the state store.
      store.count = await service.request(GET_COUNT_REQUEST, []);
      service.onNotify(INCREMENT_COUNT_NOTIFICATION, ({ peerNumber }: any) => {
        // Ignore the notification if it originated with this user.
        if (peerNumber === vsls.session.peerNumber) {
          return;
        }

        store.increment();
      });
    }
  });
}
