// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('klrice-sqldev-interop.run-test-query', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		testQuery();

	//	vscode.window.showInformationMessage('Hello World from klrice-sqldev-interop!');
	});

	context.subscriptions.push(disposable);
}
//
// Helper to get links by name
//
function getLink(links:Array<{rel:String , href:String }>, name:String) : String |undefined {
	for(var i=0;i<links.length;i++){
		if ( links[i].rel === name ){
			return links[i].href;
		}
	}
	return ;
}

let sessionId:String|undefined;

async function testQuery(){
	let sqldev = vscode.extensions.getExtension("Oracle.sql-developer");
	if ( sqldev?.isActive ) {
		let sqldevExports = vscode.extensions.getExtension("Oracle.sql-developer")?.exports;
		// child process.
		const dbtoolsServer = sqldevExports.dbtoolsClient.dbtoolsServer; 
		const dbtoolsService = sqldevExports.dbtoolsClient.dbtoolsService;
		const connectionDefinitions = dbtoolsService.connectionDefinitions;
		const connectionSessions = dbtoolsService.connectionSessions;
		const editorSessions = sqldevExports?.editorSessions;
		const sqlExecution = dbtoolsService?.sqlExecution;

		const conns = await connectionDefinitions.getDatabasesConnectionsDefinitionsList();
		const connResource = getLink(conns.items[0].links,"self"); 

		
		let connectionSessionResource;
		try {
			if ( ! sessionId ){
				//
				// Session type
				//
				let connectionSession = {
				type: "stored",
					connectionDefinition: {
						href: connResource
					}
				};
		
		
				// 
				// Create a seession
				//
				let connectionSessionResourcePromise = connectionSessions.postDatabasesConnectionsSessions(connectionSession);
				
				connectionSessionResource = await connectionSessionResourcePromise;
				const seessionHref = getLink(connectionSessionResource.links,'self');
				sessionId = seessionHref?.split('/')[7];
			}
			//
			//
			vscode.window.showInformationMessage( "Using Connection:" + conns.items[0].name + "\nUsing Session:" + sessionId, { modal: false });

			//
			//
			//

			let script = {
				statementText: `select 'Hi from '|| SYS_CONTEXT ('USERENV', 'SESSION_USER') || ' ' msg from dual;`
			};
	
			let execute = dbtoolsService.sqlExecution.postDatabasesConnectionsSessionsActionsExecute(sessionId, script);
			
			vscode.window.showInformationMessage("Executing:" + script.statementText, { modal: false });

			let sqlScriptResponse = await execute;

			//
			//
			//
		
			let hello = sqlScriptResponse.items[0].resultSet.items[0];

			vscode.window.showInformationMessage(hello.MSG, { modal: false });
			
		} catch(reason) {
			let msg: string = `Unable to create the connection session resource. Can't continue. reason`;
			console.error(reason, msg);
			throw reason;
		}



	} else {
		vscode.window.showInformationMessage("SQL Developer not Active yet.", { modal: false });
	}


}
// This method is called when your extension is deactivated
export function deactivate() {}
