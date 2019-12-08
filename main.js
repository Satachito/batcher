const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, shell } = require( 'electron' )
const path = require( 'path' )

function
OpenFile() {
	const _ = dialog.showOpenDialogSync(
		{	message	: 'Select *.batch'
		,	filters	: [
				{ name: 'batcher', extensions: [ 'batch' ] }
			]
		}
	)
	if ( _ && _.length ) _.forEach( _ => createWindow( _ ) )
}

function
NewFile() {
	const _ = dialog.showSaveDialogSync(
		{	message		: '".batch" extension required.'
		,	properties	: [ 'createDirectory' ]
		}
	)
	if ( _ ) {
		if ( _.endsWith( '.batch' ) ) {
			createWindow( _ )
		} else {
			dialog.showErrorBox(
				'".batch" extension required.'
			,	'".batch"拡張子が必要です。'
			)
		}
	}
}

let windows = []

function
createWindow( file ) {

	app.addRecentDocument( file )

	const w = new BrowserWindow(
		{	width			: 1800
		,	height			: 1200
		,	webPreferences	: {
				preload			: path.join( __dirname, 'preload.js' )
			,	nodeIntegration	: true
			}
		}
	)

	windows.push( w )

	w.on(
		'closed'
	,	() => windows.filter( _ => _ != w )
	)

//	'ready-to-show'
//	'did-finish-load'

//	https://github.com/electron/electron/issues/11222

	w.loadURL( 'file://' + __dirname + '/index.html' + '?file=' + file )

	w.webContents.openDevTools()
}

function
InsertMenus() {
	const mBar = Menu.getApplicationMenu()
	if ( ! mBar ) return
	const fileMenu = mBar.items[ 1 ].submenu

	fileMenu.insert(
		0
	,	new MenuItem(
			{	type		: 'separator'
			}
		)
	)
	fileMenu.insert(
		0
	,	new MenuItem(
			{	label		: 'Open...'
			,	accelerator	: 'CmdOrCtrl+O'
			,	click		: OpenFile
			}
		)
	)
	fileMenu.insert(
		0
	,	new MenuItem(
			{	label		: 'New'
			,	accelerator	: 'CmdOrCtrl+N'
			,	click		: NewFile
			}
		)
	)
	Menu.setApplicationMenu( mBar )
}

//	MUST BE BEFORE 'ready'
app.on(
	'open-file'
,	( event, path ) => {
		event.preventDefault() 
		createWindow( path )
	}
)

app.on(
	'ready'
,	() => {
		OpenFile()
		setTimeout( InsertMenus, 0 )
	}
)

app.on(
	'window-all-closed'
,	() => process.platform != 'darwin' && app.quit()
)

app.on(
	'activate'
,	( event, hasVisibleWindows ) => !hasVisileWindows && NewFile
)

ipcMain.on(
	'save-dialog'
,	event => {
		console.log( 'ess: ', event.sender.send )
		dialog.showSaveDialog(
			{	title	: 'Save an Image'
			,	filters	: [
					{ name: 'Images', extensions: [ 'jpg', 'png', 'gif' ] }
				]
			}
		).then(
			_ => ! _.canceled && event.sender.send( 'saved-file', _.filePath )
		)
	}
)

/*
let template = [
	{	label	: 'File'
	,	submenu	: [
			{	label		: 'New'
			,	accelerator	: 'CmdOrCtrl+N'
			,	click		: NewFile
			}
		,	{	label		: 'Open...'
			,	accelerator	: 'CmdOrCtrl+O'
			,	click		: OpenFile
			}
		]
	}
,	{	label	: 'Edit'
	,	submenu	: [
			{	label		: 'Undo'
			,	accelerator	: 'CmdOrCtrl+Z'
			,	role		: 'undo'
			}
		,	{	label		: 'Redo'
			,	accelerator	: 'Shift+CmdOrCtrl+Z'
			,	role		: 'redo'
			}
		,	{ type: 'separator' }
		,	{	label		: 'Cut'
			,	accelerator	: 'CmdOrCtrl+X'
			,	role		: 'cut'
			}
		,	{	label		: 'Copy'
			,	accelerator	: 'CmdOrCtrl+C'
			,	role		: 'copy'
			}
		,	{	label		: 'Paste'
			,	accelerator	: 'CmdOrCtrl+V'
			,	role		: 'paste'
			}
		,	{	label		: 'Select All'
			,	accelerator	: 'CmdOrCtrl+A'
			,	role		: 'selectall'
			}
		]
	}
,	{	label	: 'View'
	,	submenu	: [
			{	label		: 'Reload'
			,	accelerator	: 'CmdOrCtrl+R'
			,	click		: ( item, focusedWindow ) => {
					if ( focusedWindow ) {
						// on reload, start fresh and close any old
						// open secondary windows
						if ( focusedWindow.id === 1 ) {
							BrowserWindow.getAllWindows().forEach(
								win => { if ( win.id > 1 ) win.close() }
							)
						}
						focusedWindow.reload()
					}
				}
			}
		,	{	label		: 'Toggle Full Screen'
			,	accelerator	: process.platform == 'darwin' ? 'Ctrl+Command+F' : 'F11'
			,	click		: ( item, focusedWindow ) => focusedWindow && focusedWindow.setFullScreen( !focusedWindow.isFullScreen() )
			}
		,	{	label		: 'Toggle Developer Tools'
			,	accelerator	: process.platform == 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I'
			,	click		: ( item, focusedWindow ) => focusedWindow && focusedWindow.toggleDevTools()
			}
		,	{ type: 'separator' }
		,	{	label		: 'App Menu Demo'
			,	click		: ( item, focusedWindow ) => {
					if ( focusedWindow ) {
						dialog.showMessageBox(
							focusedWindow
						,	{	type: 'info'
							,	title: 'Application Menu Demo'
							,	buttons: ['Ok']
							,	message: 'This demo is for the Menu section, showing how to create a clickable menu item in the application menu.'
							}
						)
					}
				}
			}
		]
	}
,	{	label	: 'Window'
	,	role	: 'window'
	,	submenu	: [
			{	label		: 'Minimize'
			,	accelerator	: 'CmdOrCtrl+M'
			,	role		: 'minimize'
			}
		,	{	label		: 'Close'
			,	accelerator	: 'CmdOrCtrl+W'
			,	role		: 'close'
			}
		,	{ type: 'separator' }
		,	{	label		: 'Reopen Window'
			,	accelerator	: 'CmdOrCtrl+Shift+T'
			,	enabled		: false
			,	key			: 'reopenMenuItem'
			,	click		: () => app.emit( 'activate' )
			}
		]
	}
,	{	label	: 'Help'
	,	role	: 'help'
	,	submenu	: [
			{	label		: 'Learn More'
			,	click		: () => { shell.openExternal( 'http://electron.atom.io' ) }
			}
		]
	}
]

function
addUpdateMenuItems ( items, position ) {
	if ( process.mas ) return

	const version = app.getVersion()
	let updateItems = [
		{	label		: `Version ${version}`
		,	enabled		: false
		}
	,	{	label		: 'Checking for Update'
		,	enabled		: false
		,	key			: 'checkingForUpdate'
		}
	,	{	label		: 'Check for Update'
		,	visible		: false
		,	key			: 'checkForUpdate'
		,	click		: () => { require('electron').autoUpdater.checkForUpdates() }
		}
	,	{	label		: 'Restart and Install Update'
		,	enabled		: true
		,	visible		: false
		,	key			: 'restartToUpdate'
		,	click		: () => { require('electron').autoUpdater.quitAndInstall() }
		}
	]

	items.splice.apply( items, [ position, 0 ].concat( updateItems ) )
}

function
ReopenMenuItems () {
	const mBar = Menu.getApplicationMenu()
	if ( !mBar ) []

	const v =  mBar.items.filter(
		_ => _.submenu
		?	_.submenu.items.filter( _ => _ == 'reopenMenuItem' )
		:	[]
	).reduce( ( v, _ ) => v.concat( _ ), [] )
//	console.log( v )
	return v
}

if ( process.platform === 'darwin' ) {
	const name = app.name
	template.unshift(
		{	label	: name
		,	submenu	: [
				{	label		: `About ${name}`
				,	role		: 'about'
				}
			,	{ type: 'separator' }
			,	{	label		: 'Services'
				,	role		: 'services'
				,	submenu		: []
				}
			,	{ type: 'separator' }
			,	{	label		: `Hide ${name}`
				,	accelerator	: 'Command+H'
				,	role		: 'hide'
				}
			,	{	label		: 'Hide Others'
				,	accelerator	: 'Command+Alt+H'
				,	role		: 'hideothers'
				}
			,	{	label		: 'Show All'
				,	role		: 'unhide'
				}
			,	{ type: 'separator' }
			,	{	label		: 'Quit'
				,	accelerator	: 'Command+Q'
				,	click		: () => app.quit()
				}
			]
		}
	)

	// Window menu.
	template[ template.length - 2 ].submenu.push(
		{ type: 'separator' }
	,	{	label	: 'Bring All to Front'
		,	role	: 'front'
		}
	)

	addUpdateMenuItems( template[ 0 ].submenu, 1 )
}

if ( process.platform === 'win32' ) {
	addUpdateMenuItems( 
		template[ template.length - 1 ].submenu
	,	0
	)
}

app.on(
	'browser-window-created'
,	() => ReopenMenuItems().forEach( _ => _.enabled = false )
)

app.on(
	'window-all-closed'
,	() => {
		ReopenMenuItems().forEach( _ => _.enabled = true )
		if ( process.platform != 'darwin' ) app.quit()
	}
)
*/
