let	needDraw = false
let	needSave = false
setInterval(
	() => {
		if ( needDraw ) {
			_Draw()
			needDraw = false
		}
		if ( needSave ) {
			_Save()
			needSave = false
		}
	}
,	1000 / 60
)

const
Save = () => {
	needSave = true
}

const
_Save = () => {
	if ( ! file ) {
		file = remote.dialog.showSaveDialogSync(
			{	message		: '".batch" extension required.'
			,	properties	: [ 'createDirectory' ]
			}
		)
	}
	if ( ! file ) return null
	try {
		fs.writeFileSync(
			file
		,	JSON.stringify( { elements: elements, relations: relations } )
		)
		return null
	} catch ( _ ) {
		switch (
			remote.dialog.showMessageBoxSync(
				{	type	: 'error'
				,	message	: 'The specified file is write protected or some other error.'
				,	buttons	: [ 'Continue editing', 'Ignore error and close' ]
				}
			)
		) {
		case 0:
			return true
		default:
			return null
		}
	}
}

window.onbeforeunload = () => _Save()

/*	OLD STYLE
window.onbeforeunload = () => {
	switch ( 
		remote.dialog.showMessageBoxSync(
			remote.getCurrentWindow()
		,	{	type		: 'question'
			,	message		: 'This document has unsaved change, save it?'
			,	buttons		: [ 'Save', 'Cancel', 'Don\'t Save' ]
			,	defaultId	: 0
			,	cancelId	: 1
			}
		)
	) {
	case 0:
		return Save()
	case 1:
		return true
	default:
		return null
	}
}
*/

//	General Utilties

const
Q = _ => document.querySelector( _ )

const
E = ( tag, attributes = {}, children = [] ) => {
	const _ = document.createElement( tag )
	for ( key in attributes ) _.setAttribute( key, attributes[ key ] )
	for ( c of children ) _.appendChild( c )
	return _
}

const
B = ( text, onclick ) => {
	const _ = E( 'button' )
	_.textContent = text
	_.onclick = onclick
	return _
}

//	Data

let
elements = {
}


let
relations = [
]

const
AddElements		= _ => {
	let	wSavedSelection = selection.map( _ => _ )
	let	max = Object.keys( elements ).length == 0 ? 0 : Math.max( ...Object.keys( elements ) )
console.log( 'max: ', max )
	let	keys = _.map( _ => ( ++max ).toString() )
	Job(
		{	Do: 	() => {
				for ( let i in keys ) elements[ keys[ i ] ] = _[ i ]
				selection = keys
			}
		,	Undo: 	() => {
				for ( let key of keys ) delete elements[ key ]
				selection = wSavedSelection
			}
		}
	)
	return keys
}

const
MoveElements	= _ => {	//	[ [ key, rect ] ]
	const wSaved = _.map( _ => elements[ _[ 0 ] ][ 1 ] )
	Job(
		{	Do: 	() => { for ( let kr of _ ) elements[ kr[ 0 ] ][ 1 ] = kr[ 1 ] }
		,	Undo: 	() => { for ( let i in _ ) elements[ _[ i ][ 0 ] ][ 1 ] = wSaved[ i ] }
		}
	)
}

const
ChangeText		= ( key, text ) => {
	if ( elements[ key ][ 2 ] == text ) return
	const wSaved = elements[ key ][ 2 ]
	Job(
		{	Do: 	() => elements[ key ][ 2 ] = text
		,	Undo: 	() => elements[ key ][ 2 ] = wSaved
		}
	)
}
const
ChangeText_Direct	= ( key, text ) => {
	if ( elements[ key ][ 2 ] == text ) return
	elements[ key ][ 2 ] = text
	Draw()
	Save()
}


const
RemoveElements	= _ => {
	const wSavedSelection = selection
	const wSaved = _.map( _ => elements[ _ ] )
	const wSavedRelations = []
	for ( let i in relations ) {
		if ( _.includes( relations[ i ][ 0 ] ) || _.includes( relations[ i ][ 1 ] ) ) wSavedRelations.push( [ i, relations[ i ] ] )
	}
	Job(
		{	Do: 	() => {
				_.forEach( _ => delete elements[ _ ] )
				selection = selection.filter( key => !_.includes( key ) )
				wSavedRelations.map( _ => _[ 0 ] ).reverse().forEach( _ => relations.splice( _, 1 ) )
			}
		,	Undo: 	() => {
				for ( let i = 0; i < _.length; i++ ) elements[ _[ i ] ] = wSaved[ i ]
				selection = wSavedSelection
				wSavedRelations.forEach( _ => relations.splice( _[ 0 ], 0, _[ 1 ] ) )
			}
		}
	)
}

const
AddRelation		= _ => {
	Job(
		{	Do: 	() => relations.push( _ )
		,	Undo: 	() => relations.pop()
		}
	)
}

const
RemoveRelation	= _ => {
	const wSaved = relations[ _ ]
	Job(
		{	Do: 	() => relations.splice( _, 1 )
		,	Undo: 	() => relations.splice( _, 0, wSaved )
		}
	)
}

//	Dialog

let
ModalDialog

const
ShowModalDialog = _ => {
	ModalDialog = _
	document.body.appendChild( ModalDialog )
	ModalDialog.showModal()
}

const
CloseModalDialog = () => {
	ModalDialog.close()
	ModalDialog.parentNode.removeChild( ModalDialog )
	ModalDialog = null
}

//	App GUI

let
mode = 'select'

let
selection = []

let
b = null

let
c = null

let
running = new Set()

//	App Utilities

const
Mid = _ => [ _[ 1 ][ 0 ] + _[ 1 ][ 2 ] / 2, _[ 1 ][ 1 ] + _[ 1 ][ 3 ] / 2 ]
 
const
Label = _ => _[ 2 ].split( '\n' )[ 0 ]

const
MMRect = ( x, y, w, h ) => [ x, y, x + w, y + h ]

const
WHRect = ( minX, minY, maxX, maxY ) => [ minX, minY, maxX - minX, maxY - minY ]

const
Extent = () => Object.values( elements ).map( e => e[ 1 ] ).reduce(
	( a, c ) => {
		if ( c[ 0 ] + c[ 2 ] > a[ 0 ] ) a[ 0 ] = c[ 0 ] + c[ 2 ]
		if ( c[ 1 ] + c[ 3 ] > a[ 1 ] ) a[ 1 ] = c[ 1 ] + c[ 3 ]
		return a
	}
,	[ 0, 0 ]
).map( _ => _ + 100 ).map( _ => Math.max( _, 1000 ) )

const
FileShape = ( ctx, x, y, w, h ) => {
	const midX = x + w / 2
	const midY = y + h / 2
	const maxX = x + w
	const maxY = y + h
	ctx.beginPath()
	ctx.moveTo( midX, y )
	ctx.bezierCurveTo( maxX, y, maxX, y, maxX, midY )
	ctx.bezierCurveTo( maxX, maxY, maxX, maxY, midX, maxY )
	ctx.bezierCurveTo( x, maxY, x, maxY, x, midY )
	ctx.bezierCurveTo( x, y, x, y, midX, y )
	ctx.closePath()
}

const
DrawComment = ( ctx, key, e ) => {
	ctx.fillStyle = 'white'
	ctx.fillRect( ...e[ 1 ] )
	ctx.strokeStyle = selection.includes( key ) ? 'red' : 'black'
	ctx.strokeRect( ...e[ 1 ] )
	ctx.font="18px monospace"
	ctx.textAlign="center"
	ctx.textBaseline="middle"
	ctx.fillStyle = 'black'
	ctx.fillText( e[ 2 ], ...Mid( e ), e[ 1 ][ 2 ] )
}

const
DrawProc = ( ctx, key, e ) => {
	ctx.fillStyle = running.has( key ) ? 'red' : 'white'
	ctx.fillRect( ...e[ 1 ] )
	ctx.strokeStyle = selection.includes( key ) ? 'red' : 'black'
	ctx.strokeRect( ...e[ 1 ] )
	ctx.font="12px monospace"
	ctx.textAlign="start"
	ctx.textBaseline="alphabetic"
	ctx.fillStyle = 'black'
	ctx.fillText( key + ' ' + e[ 0 ], e[ 1 ][ 0 ] + 2, e[ 1 ][ 1 ] + 12 )
	ctx.font="18px monospace"
	ctx.textAlign="center"
	ctx.textBaseline="middle"
	ctx.fillText( Label( e ), ...Mid( e ), e[ 1 ][ 2 ] )
}

const
DrawFile = ( ctx, key, e ) => {
	FileShape( ctx, ...e[ 1 ] )
	ctx.fillStyle = 'white'
	ctx.fill()
	ctx.strokeStyle = selection.includes( key ) ? 'red' : 'black'
	ctx.stroke()
	ctx.font="18px monospace"
	ctx.textAlign="center"
	ctx.textBaseline="middle"
	const w = e[ 2 ].split( '\n' )
	switch ( w.length ) {
	case 1:
		ctx.fillStyle = 'black'
		ctx.fillText( w[ 0 ], ...Mid( e ), e[ 1 ][ 2 ] )
		break;
	default:
		const wMid = Mid( e )
		wMid[ 1 ] -= e[ 1 ][ 3 ] / 6
		ctx.fillStyle = 'black'
		ctx.fillText( w[ 0 ], ...wMid, e[ 1 ][ 2 ] )
		wMid[ 1 ] += e[ 1 ][ 3 ] / 3
		ctx.fillText( w[ 1 ], ...wMid, e[ 1 ][ 2 ] )
		break;
	}
}

const
Draw = () => needDraw = true

const
_Draw = () => {
	const canvas = Q( 'canvas' )
	const ctx = canvas.getContext( '2d' )
	ctx.clearRect( 0, 0, canvas.width, canvas.height )

	const drawLine = ( w, m, l ) => {
		ctx.beginPath()
		ctx.moveTo( ...m )
		ctx.lineTo( ...l )
		switch ( w ) {
		case 'std'	: ctx.setLineDash( [] )			; break
		case 'arg'	: ctx.setLineDash( [ 2 ] )		; break
		case 'auto'	: ctx.setLineDash( [ 10, 5 ] )	; break
		}
		ctx.strokeStyle = 'black'
		ctx.stroke()
		ctx.setLineDash( [] )

		const midX = ( l[ 0 ] + m[ 0 ] ) / 2
		const midY = ( l[ 1 ] + m[ 1 ] ) / 2
		const slope1 = Math.atan2( l[ 1 ] - m[ 1 ], l[ 0 ] - m[ 0 ] )
		const slope2 = slope1 + Math.PI / 2
		const newX = Math.cos( slope2 ) * 4
		const newY = Math.sin( slope2 ) * 4
		ctx.beginPath()
		ctx.moveTo( midX - newX, midY - newY )
		ctx.lineTo( midX + newX, midY + newY )
		ctx.lineTo( midX + Math.cos( slope1 ) * 16, midY + Math.sin( slope1 ) * 16 )
		ctx.closePath()
		ctx.fillStyle = 'black'
		ctx.fill()
		ctx.beginPath()
		ctx.arc( midX, midY, 16, 0, Math.PI * 2, false )
		ctx.strokeStyle = 'black'
		ctx.stroke()
	}

	for ( let r of relations ) drawLine(
		r[ 2 ]
	,	Mid( elements[ r[ 0 ] ] )
	,	Mid( elements[ r[ 1 ] ] )
	)

	for ( let key of Object.keys( elements ) ) {
		const e = elements[ key ]
		switch ( e[ 0 ] ) {
		case 'sh'		:
		case 'batch'	:
		case 'python2'	:
		case 'python3'	:
		case 'node'		:
			DrawProc( ctx, key, e )
			const args = relations.filter( _ => _[ 2 ] == 'arg' && ( _[ 0 ] == key || _[ 1 ] == key ) )
			ctx.font="18px monospace"
			for ( let i = 0; i < args.length; i++ ) {
				const r = args[ i ]
				const w1 = Mid( elements[ r[ 0 ] ] )
				const w2 = Mid( elements[ r[ 1 ] ] )
				const slope1 = Math.atan2( w2[ 1 ] - w1[ 1 ], w2[ 0 ] - w1[ 0 ] )
				ctx.fillStyle = 'black'
				ctx.fillText(
					"" + ( i + 1 )
				,	( w1[ 0 ] + w2[ 0 ] ) / 2 - Math.cos( slope1 ) * 8
				,	( w1[ 1 ] + w2[ 1 ] ) / 2 - Math.sin( slope1 ) * 8
				)
			}
			break
		case 'file'		:
			DrawFile( ctx, key, e )
			break
		case 'comm'		:
			DrawComment( ctx, key, e )
			break
		}
	}

	const selectionRect = SelectionRectWH()
	if ( selectionRect ) {
		ctx.strokeStyle = 'red'
		ctx.strokeRect( ...selectionRect )
	}

	if ( ! c ) return	//	c must be set
	if ( b ) {	//	Dragging
		if ( !selectionRect ) return
		let	where = Hit( b, selectionRect )
		if ( !where ) return
		switch ( mode ) {
		case 'select':
			switch ( where ) {
			case 'CC':
				ctx.strokeStyle = 'red'
				ctx.strokeRect( ...Move( selectionRect ) )
				break
			default:
				ctx.strokeStyle = 'red'
				ctx.strokeRect( ...Morph( selectionRect, where ) )
				break
			}
			break
		case 'std'	:
		case 'arg'	:
		case 'auto'	:
			drawLine( mode, [ b.offsetX, b.offsetY ], [ c.offsetX, c.offsetY ] )
			break
		}
	} else {		//	Moving
		ctx.strokeStyle = 'green'
		switch ( mode ) {
		case 'select'	:
			break
		case 'sh'		:
		case 'batch'	:
		case 'python2'	:
		case 'python3'	:
		case 'node'		:
			ctx.strokeRect( c.offsetX - 80, c.offsetY - 30, 160, 60 )
			break
		case 'file':
			FileShape( ctx, c.offsetX - 80, c.offsetY - 30, 160, 60 )
			ctx.stroke()
		}
	}
}
const
Move = r => {
	return [ r[ 0 ] + c.offsetX - b.offsetX, r[ 1 ] + c.offsetY - b.offsetY, r[ 2 ], r[ 3 ] ]
}
const
Morph = ( r, where ) => {
	let	[ minX, minY, maxX, maxY ] = MMRect( ...r )
	switch ( where[ 0 ] ) {
	case 'L':	minX += c.offsetX - b.offsetX;	break
	case 'R':	maxX += c.offsetX - b.offsetX;	break
	}
	switch ( where[ 1 ] ) {
	case 'T':	minY += c.offsetY - b.offsetY;	break
	case 'B':	maxY += c.offsetY - b.offsetY;	break
	}
	if ( minX > maxX ) [ minX, maxX ] = [ maxX, minX ]
	if ( minY > maxY ) [ minY, maxY ] = [ maxY, minY ]
	return WHRect( minX, minY, maxX, maxY )
}
const
LineHit = _ => {
	for ( let index in relations ) {
		const e = relations[ index ]
		const l = Mid( elements[ e[ 0 ] ] )
		const r = Mid( elements[ e[ 1 ] ] )
		const x = ( l[ 0 ] + r[ 0 ] ) / 2
		const y = ( l[ 1 ] + r[ 1 ] ) / 2
		if ( Math.abs( x - _.offsetX ) < 16 && Math.abs( y - _.offsetY ) < 16 ) return index
	}
	return null
}
const
ElementHit = _ => {
	const x = _.offsetX
	const y = _.offsetY
	let v = null
	for ( let key of Object.keys( elements ).reverse() ) {
		const r = elements[ key ][ 1 ]
		if ( x < r[ 0 ] || r[ 0 ] + r[ 2 ] < x ) continue
		if ( y < r[ 1 ] || r[ 1 ] + r[ 3 ] < y ) continue
		v = key
		break
	}
	return v
}

const
SelectionRectMM = () => {
	if ( !selection.length ) return null
	let [ minX, minY, maxX, maxY ] = MMRect( ...elements[ selection[ 0 ] ][ 1 ] )
	for ( let i = 1; i < selection.length; i++ ) {
		const [ x, y, w, h ] = elements[ selection[ i ] ][ 1 ]
		if ( maxX < x + w ) maxX = x + w
		if ( maxY < y + h ) maxY = y + h
		if ( x < minX ) minX = x
		if ( y < minY ) minY = y
	}
	return [ minX, minY, maxX, maxY ]
}

const
SelectionRectWH = () => {
	const v = SelectionRectMM()
	return v ? WHRect( ...v ) : null
}

const
Hit = ( _, rectWH ) => {
	const [ minX, minY, maxX, maxY ] = MMRect( ...rectWH )
	const x = _.offsetX
	const y = _.offsetY
	const v = (
		minX - 8 < x && x < maxX + 8
		?	x < minX
			?	'L'
			:	maxX < x ? 'R' : 'C'
		:	''
	) + (
		minY - 8 < y && y < maxY + 8
		?	y < minY
			?	'T'
			:	maxY < y ? 'B' : 'C'
		:	''
	)
	return v.length == 2 ? v : null
}

const
SetMode = _ => {
	const canvas = Q( 'canvas' )
	mode = _
	canvas.focus( { preventScroll: true } )
	switch ( mode ) {
	case 'std'	:
	case 'arg'	:
	case 'auto'	:
		canvas.classList.add( 'crossHair' )
		break
	default		:
		canvas.classList.remove( 'crossHair' )
		break
	}
}

//	Event Handlers

const
MouseDown = ev => {

	if ( ev.button ) return

	b = ev

	switch ( mode ) {
	case 'select'	:
		const key = ElementHit( b )
		if ( key ) {
			if ( ev.shiftKey ) {
				if ( selection.includes( key ) )	selection = selection.filter( _ => _ != key )
				else								selection.push( key )
			} else {
				if ( !selection.includes( key ) )	selection = [ key ]
			}
		} else {
			const r = SelectionRectWH()
			if ( r && !Hit( b, r ) ) selection = []
		}
		Draw()
		break
	}
}

const
MouseMove = ev => {
	c = ev
	Draw()
}

const
MouseUp = ev => {

	if ( ev.button ) return

	if ( !b ) return

	switch ( mode ) {
	case 'select'	:
		if ( b.offsetX != c.offsetX || b.offsetY != c.offsetY ) {
			const rect = SelectionRectWH()
			if ( rect ) {
				const where = Hit( b, rect )
				if ( where ) {
					switch ( where ) {
					case 'CC':
						MoveElements( selection.map( key => [ key, Move( elements[ key ][ 1 ] ) ] ) )
						break
					default:
						MoveElements( selection.map( key => [ key, Morph( elements[ key ][ 1 ], where ) ] ) )
						break
					}
				}
			}
		}
		break
	case 'std'		:
	case 'arg'		:
	case 'auto'		:
		const wB = ElementHit( b ); if ( ! wB ) return
		const wC = ElementHit( c ); if ( ! wC ) return
		if ( wB == wC ) return
		if (
			( elements[ wB ][ 0 ] == 'file' && elements[ wC ][ 0 ] == 'file' )
		||	( elements[ wB ][ 0 ] != 'file' && elements[ wC ][ 0 ] != 'file' )
		) {
			alert( 'Connection must be in between file and procedure' )
		} else {
			AddRelation( [ wB, wC, mode ] )
		}
		if ( ! ev.shiftKey ) SetMode( 'select' )
		break
	case 'file'		:
	case 'sh'		:
	case 'batch'	:
	case 'python2'	:
	case 'python3'	:
	case 'node'		:
		const rect = [ ev.offsetX - 80, ev.offsetY - 30, 160, 60 ]
		const ta = E( 'textarea', { cols: '128', rows: '20' } )
		const wMode = mode
		ShowModalDialog(
			E(	'dialog'
			,	{ center: true }
			,	[	ta
				,	E( 'br' )
				,	B(	'OK'
					,	() => {
							CloseModalDialog()
							AddElements( [ [ wMode, rect, ta.value ] ] )
						}
					)
				,	B( 'Cancel', CloseModalDialog )
				]
			)
		)
		if ( !ev.shiftKey ) SetMode( 'select' )
		break
	}
//
	b = null
	Draw()
}

const
DoubleClick = ev => {

	if ( ev.metaKey ) return

	const key = ElementHit( ev )
	if ( !key ) return
	const ta = E( 'textarea', { cols: '128', rows: '20' } )
	ta.value = elements[ key ][ 2 ]
	ShowModalDialog(
		E(	'dialog'
		,	{ center: true }
		,	[	ta
			,	E( 'br' )
			,	B(	'OK'
				,	() => {
						CloseModalDialog()
						ChangeText( key, ta.value )
					}
				)
			,	B( 'Cancel', CloseModalDialog )
			]
		)
	)
}

const
CheckFiles = () => {
	Object.keys( elements ).filter( _ => elements[ _ ][ 0 ] == 'file' ).forEach(
		key => {
			const fileName = Label( elements[ key ] )
			fs.stat(
				fileName
			,	( er, stat ) => {
					let newText = fileName
					if ( er ) newText += '\n' + er.code
					if ( stat ) newText += '\n' + stat.size + ' ' + stat.mtime
					ChangeText_Direct( key, newText )
				}
			)
		}
	)
}

const
MakeProcChain = fileKey => {
	const Upper = key => relations.filter( _ => _[ 1 ] == key ).map( _ => _[ 0 ] )
	const inProcs = Upper( fileKey )
	const inFiles = inProcs.map( _ => Upper( _ ) ).reduce( ( a, c ) => a.concat( c ), [] )
	return inFiles.length
	?	inFiles.map( _ => MakeProcChain( _ ) ).reduce( ( a, c ) => a.concat( c ), [] ).concat( inProcs )
	:	inProcs
}

const
Console = ( q, _ ) => {
	const e = Q( q )
	e.value += _
	e.scrollTop = e.scrollHeight
}

const
LogConsole = _ => Console( '#log', _ )

const
ErrorConsole = _ => Console( '#error', _ )

const
Warning = _ => {
	console.error( _ )
	remote.dialog.showMessageBoxSync(
		{	type	: 'warning'
		,	message	: _
		}
	)
}

const
Run = keys => {
	try {
		_Run( keys )
	} catch ( _ ) {
		Warning( _ )
	}
}

const
Stats = _ => Promise.all( _.map( _ => promisify( fs.stat )( _ ) ) )

const
_Run = keys => {
	if ( !keys.length ) {
		console.log( 'DONE' )
		CheckFiles()
		return
	}
	const key = keys[ 0 ]
	const e = elements[ key ]
	switch ( e[ 0 ] ) {
	case 'file'	:
		_Run( MakeProcChain( key ) )
		break
	case 'sh'	:
		console.log( key + ' : prep : ' + e[ 0 ] + ' : ' + Label( e ) )
		{	const
			inputFiles = relations.filter( _ => _[ 1 ] == key ).map( _ => Label( elements[ _[ 0 ] ] ) )

			Stats( inputFiles ).then(
				_ => {
					const
					stdin = relations.filter( _ => _[ 1 ] == key && _[ 2 ] == 'std' ).map( _ => Label( elements[ _[ 0 ] ] ) )
					if ( stdin.length > 1 ) throw( 'multiple stdin' )

					const
					stdout = relations.filter( _ => _[ 0 ] == key && _[ 2 ] == 'std' ).map( _ => Label( elements[ _[ 1 ] ] ) )
					if ( stdout.length > 1 ) throw( 'multiple stdout' )

					const
					args = relations.filter( _ => _[ 2 ] == 'arg' ).map(
						_ => _[ 0 ] == key
						?	Label( elements[ _[ 1 ] ] )
						:	_[ 1 ] == key
							?	Label( elements[ _[ 0 ] ] )
							:	null
					).filter( _ => _ )

					console.log( key + ' : run  : ' + e[ 0 ] + ' : ' + Label( e ) )
					let exec = stdin.length ? ( 'cat ' + stdin[ 0 ] + ' | ' ) : ''
					exec += Label( e )
					args.forEach( _ => exec += ' ' + _ )
					if ( stdout.length ) exec += ' > ' + stdout[ 0 ]
					child_process.exec(
						exec
					,	( er, stdout, stderr ) => {
							running.delete( key )
							Draw()
							console.log( key + ' : fin  : ' + e[ 0 ] + ' : ' + Label( e ) + ' : ' + JSON.stringify( { er, stdout, stderr } ) )
							if ( stdout )	LogConsole( stdout.toString() )
							if ( stderr )	ErrorConsole( stderr.toString() )
							if ( er )		throw er.toString()
							else			_Run( keys.filter( ( _, i ) => i != 0 ) )
						}
					)
					running.add( key )
					Draw()
				}
			).catch(
				_ => { throw 'Some troubles in input file' }
			)
		}
		break
	case 'batch'	:
	case 'python2'	:
	case 'python3'	:
	case 'node'		:
		{	const
			execName = e[ 0 ] == 'batch' ? 'sh' : e[ 0 ]

			console.log( key + ' : prep : ' + execName + ' : ' + Label( e ) )

			const
			inputFiles = relations.filter( _ => _[ 1 ] == key ).map( _ => Label( elements[ _[ 0 ] ] ) )

			Stats( inputFiles ).then(
				_ => {
					const
					stdin = relations.filter( _ => _[ 1 ] == key && _[ 2 ] == 'std' ).map( _ => Label( elements[ _[ 0 ] ] ) )
					if ( stdin.length > 1 ) throw( 'multiple stdin' )

					const
					stdout = relations.filter( _ => _[ 0 ] == key && _[ 2 ] == 'std' ).map( _ => Label( elements[ _[ 1 ] ] ) )
					if ( stdout.length > 1 ) throw( 'multiple stdout' )

					const
					args = relations.filter( _ => _[ 2 ] == 'arg' ).map(
						_ => _[ 0 ] == key
						?	Label( elements[ _[ 1 ] ] )
						:	_[ 1 ] == key
							?	Label( elements[ _[ 0 ] ] )
							:	null
					).filter( _ => _ )

					console.log( key + ' : save : ' + execName + ' : ' + Label( e ) )
					try {
						const
						tmpFileName = '.' + key

						fs.writeFileSync(
							tmpFileName
						,	e[ 2 ]
						)
						console.log( key + ' : run  : ' + execName + ' : ' + Label( e ) )

						const spawned = child_process.spawn(
							execName
						,	[ tmpFileName, ...args ]
						)
						if ( stdin.length ) fs.createReadStream( stdin[ 0 ] ).pipe( spawned.stdin )
						if ( stdout.length ) {
							spawned.stdout.pipe( fs.createWriteStream( stdout[ 0 ] ) )
						} else {
							spawned.stdout.on(
								'data'
							,	_ => LogConsole( _.toString() )
							)
						}
						spawned.stderr.on(
							'data'
						,	_ => ErrorConsole( _.toString() )
						)
						spawned.on(
							'close'
						,	( code, signal ) => console.log( 'close', code, signal )
						)
						spawned.on(
							'exit'
						,	( code, signal ) => {
								console.log( 'exit', code, signal )
								running.delete( key )
								Draw()
								_Run( keys.filter( ( _, i ) => i != 0 ) )
							}
						)
						spawned.on(
							'error'
						,	_ => { throw _.toString() }
						)
						running.add( key )
						Draw()
					} catch ( _ ) {
						console.error( _ )
					}
				}
			).catch(
				_ => { throw _.toString() }
			)
		}
		break
	default		:
		break
	}
}

window.addEventListener(
	'DOMContentLoaded'
,	() => {
		const canvas = Q( 'canvas' )
		canvas.addEventListener(
			'contextmenu'
		,	ev => {
				const key = ElementHit( ev )
				if ( key ) {
					const cm = new remote.Menu()
					cm.append(
						new remote.MenuItem(
							{	label: 'Delete'
							,	click: () => RemoveElements( [ key ] )
							}
						)
					)
					cm.append(
						new remote.MenuItem(
							{	label: 'Run'
							,	click: () => Run( [ key ] )
							}
						)
					)
					if ( elements[ key ][ 0 ] == 'file' ) {
						cm.append(
							new remote.MenuItem(
								{	label: 'Unlink'
								,	click: () => fs.unlink(
										Label( elements[ key ] )
									,	er => er
										?	Warning( er.toString() )
										:	CheckFiles()
									)
								}
							)
						)
					}
					cm.popup()
					return
				}
				const index = LineHit( ev )
				if ( index ) {
					const cm = new remote.Menu()
					cm.append(
						new remote.MenuItem(
							{	label: 'Delete'
							,	click: ev => RemoveRelation( index )
							}
						)
					)
					cm.popup()
					return
				}
			}
		)
		canvas.addEventListener( 'mousedown', MouseDown		)
		canvas.addEventListener( 'mousemove', MouseMove		)
		canvas.addEventListener( 'mouseup'	, MouseUp		)

		canvas.addEventListener( 'dblclick'	, DoubleClick	)

		canvas.addEventListener(
			'keyup'
		,	() => {
				SetMode( 'select' )
				b = null
				Draw()
			}
		)
		Q( '#modeSelect'	).addEventListener( 'click', () => SetMode( 'select'	) )
		Q( '#modeFile'		).addEventListener( 'click', () => SetMode( 'file'		) )
		Q( '#modeSh'		).addEventListener( 'click', () => SetMode( 'sh'		) )
		Q( '#modeBatch'		).addEventListener( 'click', () => SetMode( 'batch'		) )
		Q( '#modePython2'	).addEventListener( 'click', () => SetMode( 'python2'	) )
		Q( '#modePython3'	).addEventListener( 'click', () => SetMode( 'python3'	) )
		Q( '#modeNode'		).addEventListener( 'click', () => SetMode( 'node'		) )
		Q( '#modeStd'		).addEventListener( 'click', () => SetMode( 'std'		) )
		Q( '#modeArg'		).addEventListener( 'click', () => SetMode( 'arg'		) )
		Q( '#modeAuto'		).addEventListener( 'click', () => SetMode( 'auto'		) )

		Q( '#clearLog'		).addEventListener( 'click', () => Q( '#log' ).value = '' )
		Q( '#clearError'	).addEventListener( 'click', () => Q( '#error' ).value = '' )

		Q( '#checkFiles'	).addEventListener( 'click', CheckFiles )
	}
)

let file = new URLSearchParams( window.location.search ).get( 'file' )
document.title = file
try {
	proc.chdir( path.dirname( file ) )
	fs.readFile(
		file
	,	'utf-8'
	,	( er, _ ) => {
			if ( er ) {
				alert( er )
				file = null
			} else {
				const w = JSON.parse( _ )
				elements = w.elements
				relations = w.relations
				Draw()
			}
		}
	)
} catch ( _ ) {
	alert( _ )
}

undos = []
redos = []

const
Undo = () => {
	if ( !undos.length ) return
	redos.unshift( undos[ 0 ] )
	undos[ 0 ].Undo()
	undos.splice( 0, 1 )
	Draw()
	Save()
}

const
Redo = () => {
	if ( !redos.length ) return
	undos.unshift( redos[ 0 ] )
	redos[ 0 ].Do()
	redos.splice( 0, 1 )
	Draw()
	Save()
}

const
Job = _ => {
	undos.unshift( _ )
	redos = []
	_.Do()
	Draw()
	Save()
}

const
Delete = () => {
	if ( !selection.length ) return
	RemoveElements( selection )
}

const
Cut = () => {
	Copy()
	Delete()
}

const
Copy = () => {
	if ( !selection.length ) return
	remote.clipboard.writeText(
		JSON.stringify(
			[	'Batcher'
			,	selection.map( _ => elements[ _ ] )
			]
		)
	)
}

const
Paste = () => {
	try {
		const _ = JSON.parse( remote.clipboard.readText() )
		if ( !Array.isArray( _ ) || _.length != 2 || _[ 0 ] != 'Batcher' ) return
		const SlideRect = _ => [ _[ 0 ] + 16, _[ 1 ] + 16, _[ 2 ], _[ 3 ] ]
		AddElements( _[ 1 ].map( _ =>  [ _[ 0 ], SlideRect( _[ 1 ] ), _[ 2 ] ] ) )
	} catch {
		console.error( 'Clipboard Invalid' )
	}
}

ipcRenderer.on( 'status', () => ipcRenderer.send( 'status', { undos, redos, selection } ) )

ipcRenderer.on( 'undo'	, Undo		)
ipcRenderer.on( 'redo'	, Redo		)
ipcRenderer.on( 'cut'	, Cut		)
ipcRenderer.on( 'delete', Delete	)
ipcRenderer.on( 'copy'	, Copy		)
ipcRenderer.on( 'paste'	, Paste		)

