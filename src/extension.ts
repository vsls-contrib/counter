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
  const vsls = (await getApi())!;

  let service: SharedService | SharedServiceProxy | null;

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

  vsls.onDidChangeSession(async e => {
    if (e.session.role === Role.Host) {
      store.count = 0;

      service = await vsls.shareService(SERVICE_NAME);
      service!.onRequest(GET_COUNT_REQUEST, () => {
        return store.count;
      });

      service!.onNotify(INCREMENT_COUNT_NOTIFICATION, e => {
        store.increment();
        service!.notify(INCREMENT_COUNT_NOTIFICATION, e);
      });
    } else if (e.session.role === Role.Guest) {
      service = await vsls.getSharedService(SERVICE_NAME);
      if (!service) {
        return;
      }

      store.count = await service.request(GET_COUNT_REQUEST, []);
      service.onNotify(INCREMENT_COUNT_NOTIFICATION, ({ peerNumber }: any) => {
        if (peerNumber === vsls.session.peerNumber) {
          return;
        }

        store.increment();
      });
    }
  });
}
