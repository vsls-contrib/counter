import { Command, Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { INCREMENT_COUNT_COMMAND } from './constants';
import { ICountStore } from './store';

export class CountTreeDataProvider implements TreeDataProvider<Command> {
	private _command: Command = {
		command: INCREMENT_COUNT_COMMAND,
		title: 'Increment Count'
	};

	private _onDidChangeTreeData = new EventEmitter<Command>();
	public readonly onDidChangeTreeData: Event<Command> = this._onDidChangeTreeData.event;

	constructor(private store: ICountStore) {
		store.onChange(() => {
			this._onDidChangeTreeData.fire(this._command);
		})
	}

	getChildren(element?: Command): ProviderResult<Command[]> {
		return Promise.resolve([this._command]);
	}
  
	getTreeItem(element: Command): TreeItem {
	  	const treeItem = new TreeItem(`Count: ${this.store.count}`);
	  	treeItem.command = element;
	  	return treeItem;
	}
}