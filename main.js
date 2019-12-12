const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, shell } = require( 'electron' )

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

/*	DAME PPOI
const
ModMenu = () => {
	const
	CopyMenuItem = _ => {
		const v = new MenuItem( {} )
		for ( k in _ ) v[ k ] = _[ k ]
		if ( _.submenu ) v.submenu = CopyMenu( _.submenu )
		v.click = ( menuItem, browserWindow, event ) => _.click( menuItem, browserWindow, event )
		return v
	}
	const
	CopyMenu = _ => {
		const v = new Menu()
		_.items.forEach( _ => v.append( CopyMenuItem( _ ) ) )
		return v
	}

	Menu.setApplicationMenu( CopyMenu( Menu.getApplicationMenu() ) )
}

const
ModMenu = () => {
	const mBar = Menu.getApplicationMenu()

	const fileMenu = mBar.items[ isMac ? 1 : 0 ].submenu
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
*/

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
		,	{ role: 'cut' }
		,	{ role: 'copy' }
		,	{ role: 'paste' }
		,	...(
				isMac
			?	[	{ role: 'pasteAndMatchStyle' }
				,	{ role: 'delete' }
				,	{ role: 'selectAll' }
				,	{ type: 'separator' }
				,	{	label	: 'Speech'
					,	submenu	: [
							{ role: 'startspeaking' }
						,	{ role: 'stopspeaking' }
						]
					}
				]
			:	[	{ role: 'delete' }
				,	{ type: 'separator' }
				,	{ role: 'selectAll' }
				]
			)
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
					const { shell } = require( 'electron' )
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
//		setTimeout( ModMenu, 0 )
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
		if ( _ ) _.send( 'job' )
	}
,	1000 / 60
)

ipcMain.on(
	'job'
,	( ev, _ ) => {
		const wMIs = Menu.getApplicationMenu().items[ isMac ? 2 : 1 ].submenu.items
		wMIs[ 0 ].enabled = _.undos.length > 0
		wMIs[ 1 ].enabled = _.redos.length > 0
	}
)














/*
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

	const v =	mBar.items.filter(
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
