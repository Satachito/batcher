const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, shell, clipboard } = require( 'electron' )

const
OpenFile = () => {
	const _ = dialog.showOpenDialogSync(
		{	message	: 'Select *.batch'
		,	filters	: [
				{ name: 'batcher', extensions: [ 'batch' ] }
			]
		}
	)
	if ( _ && _.length ) _.forEach( _ => createWindow( _ ) )
}

const
NewFile = () => {
	const _ = dialog.showSaveDialogSync(
		{	message		: '".batch" extension required.'
		,	properties	: [ 'createDirectory' ]
		}
	)
	if ( _ ) {
		if ( _.endsWith( '.batch' ) ) {
			require( 'fs' ).writeFileSync( _, JSON.stringify( { relations: [], elements: {} } ) )
			createWindow( _ )
		} else {
			dialog.showErrorBox(
				'".batch" extension required.'
			,	'".batch"拡張子が必要です。'
			)
		}
	}
}

const
createWindow = file => {

	app.addRecentDocument( file )

	const _ = new BrowserWindow(
		{	width			: 1800
		,	height			: 1200
		,	webPreferences	: {
				preload			: __dirname + '/preload.js'
			}
		}
	)

//	https://github.com/electron/electron/issues/11222
	_.loadURL( 'file://' + __dirname + '/index.html' + '?file=' + file )

	_.webContents.openDevTools()
}

//	https://electronjs.org/docs/api/menu
const
isMac = process.platform === 'darwin'

const
template = [
	...(
		isMac
		?	[	{	role	: 'appMenu'
				,	submenu	: [
						{ role: 'about' }
					,	{ type: 'separator' }
					,	{ role: 'services' }
					,	{ type: 'separator' }
					,	{ role: 'hide' }
					,	{ role: 'hideothers' }
					,	{ role: 'unhide' }
					,	{ type: 'separator' }
					,	{ role: 'quit' }
					]
				}
			]
		:	[]
	)
,	{	role	: 'fileMenu'
	,	submenu	: [
			{	label		: 'New'
			,	accelerator	: 'CmdOrCtrl+N'
			,	click		: NewFile
			}
		,	{	label		: 'Open...'
			,	accelerator	: 'CmdOrCtrl+O'
			,	click		: OpenFile
			}
		,	{ type: 'separator' }
		,	isMac ? { role: 'close' } : { role: 'quit' }
		]
	}
,	{	role	: 'editMenu'
	,	submenu	: [
			{	label		: 'Undo'
			,	accelerator	: 'CmdOrCtrl+Z'
			,	click		: () => BrowserWindow.getFocusedWindow().send( 'undo' )
			}
		,	{	label		: 'Redo'
			,	accelerator	: 'Shift+CmdOrCtrl+Z'
			,	click		: () => BrowserWindow.getFocusedWindow().send( 'redo' )
			}
		,	{ type: 'separator' }
		,	{	label		: 'Cut'
			,	accelerator	: 'CmdOrCtrl+X'
			,	click		: () => BrowserWindow.getFocusedWindow().send( 'cut' )
			}
		,	{	label		: 'Copy'
			,	accelerator	: 'CmdOrCtrl+C'
			,	click		: () => BrowserWindow.getFocusedWindow().send( 'copy' )
			}
		,	{	label		: 'Paste'
			,	accelerator	: 'CmdOrCtrl+V'
			,	click		: () => BrowserWindow.getFocusedWindow().send( 'paste' )
			}
		,	{	label		: 'Delete'
			,	accelerator	: 'Backspace'
			,	click		: () => BrowserWindow.getFocusedWindow().send( 'delete' )
			}
		]
	}
,	{	role	: 'viewMenu'
	,	submenu	: [
			{ role: 'reload' }
		,	{ role: 'forcereload' }
		,	{ role: 'toggledevtools' }
		,	{ type: 'separator' }
		,	{ role: 'resetzoom' }
		,	{ role: 'zoomin' }
		,	{ role: 'zoomout' }
		,	{ type: 'separator' }
		,	{ role: 'togglefullscreen' }
		]
	}
,	{	role	: 'windowMenu'
	,	submenu	: [
			{ role: 'minimize' }
		,	{ role: 'zoom' }
		,	...(
				isMac
			?	[	{ type: 'separator' }
				,	{ role: 'front' }
				,	{ type: 'separator' }
				,	{ role: 'window' }
				]
			:	[ { role: 'close' } ]
			)
		]
	}
,	{	role	: 'help'
	,	submenu	: [
			{	label: 'Learn More'
			,	click: async () => {
				//	const { shell } = require( 'electron' )
					await shell.openExternal( 'https://electronjs.org' )
				}
			}
		]
	}
]

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
		Menu.setApplicationMenu( Menu.buildFromTemplate( template ) )
	}
)

app.on(
	'window-all-closed'
,	() => process.platform != 'darwin' && app.quit()
)

app.on(
	'activate'
,	( event, hasVisibleWindows ) => !hasVisibleWindows && OpenFile()
)

setInterval(
	() => {
		const _ = BrowserWindow.getFocusedWindow()
		if ( _ ) _.send( 'status' )
	}
,	1000 / 60
)

ipcMain.on(
	'status'
,	( ev, _ ) => {
		const wMIs = Menu.getApplicationMenu().items[ isMac ? 2 : 1 ].submenu.items
		wMIs[ 0 ].enabled = _.undos.length > 0
		wMIs[ 1 ].enabled = _.redos.length > 0

		wMIs[ 3 ].enabled = _.selection != null	//	Cut
		wMIs[ 4 ].enabled = _.selection != null	//	Copy
		wMIs[ 5 ].enabled = clipboard.readText() != ''	//	Paste
	}
)

