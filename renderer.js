const
Save = () => {
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
				{	message	: 'The specified file is write protected or some other error.'
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

window.onbeforeunload = Save
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
AddElement		= _ => {
	elements[ Date.now().toString() ] = _
	Draw()
}

const
AddRelation		= _ => {
	relations.push( _ )
	Draw()
}

const
MoveElement		= _ => {
	elements[ _[ 0 ] ][ 1 ] = _[ 1 ]
	Draw()
}

const
ChangeText		= _ => {
	elements[ _[ 0 ] ][ 2 ] = _[ 1 ]
	Draw()
}

const
RemoveElement	= _ => {
	elements.remove( p )
	Draw()
}

//	Dialog

let
HTMLDialog

//	

//	App GUI

let
mode = 'select'

let
b = null

let
c = null

//	App Utilities

const
Mid = _ => [ _[ 1 ][ 0 ] + _[ 1 ][ 2 ] / 2, _[ 1 ][ 1 ] + _[ 1 ][ 3 ] / 2 ]
 
const
Label = _ => _[ 2 ].split( '\n' )[ 0 ]

const
Extent = () => Object.values( this.elements ).map( e => e[ 1 ] ).reduce(
	( a, c ) => {
		if ( c[ 0 ] + c[ 2 ] > a[ 0 ] ) a[ 0 ] = c[ 0 ] + c[ 2 ]
		if ( c[ 1 ] + c[ 3 ] > a[ 1 ] ) a[ 1 ] = c[ 1 ] + c[ 3 ]
		return a
	}
,	[ 0, 0 ]
).map( _ => _ + 100 ).map( _ => Math.max( _, 1000 ) )

function
FileShape( ctx, x, y, w, h ) {
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

function
DrawComment( ctx, e ) {
	ctx.fillStyle = 'white'
	ctx.fillRect( ...e[ 1 ] )
	ctx.strokeRect( ...e[ 1 ] )
	ctx.fillStyle = 'black'
	ctx.font="18px monospace"
	ctx.textAlign="center"
	ctx.textBaseline="middle"
	ctx.fillText( e[ 2 ], ...Mid( e ), e[ 1 ][ 2 ] )
}

function
DrawProc( ctx, key, e ) {
	ctx.fillStyle = 'white'
	ctx.fillRect( ...e[ 1 ] )
	ctx.strokeRect( ...e[ 1 ] )
	ctx.fillStyle = 'black'
	ctx.font="12px monospace"
	ctx.textAlign="start"
	ctx.textBaseline="alphabetic"
	ctx.fillText( key + ' ' + e[ 0 ], e[ 1 ][ 0 ] + 2, e[ 1 ][ 1 ] + 12 )
	ctx.font="18px monospace"
	ctx.textAlign="center"
	ctx.textBaseline="middle"
	ctx.fillText( Label( e ), ...Mid( e ), e[ 1 ][ 2 ] )
}

function
DrawFile( ctx, e ) {
	FileShape( ctx, ...e[ 1 ] )
	ctx.fillStyle = 'white'
	ctx.fill()
	ctx.stroke()
	ctx.fillStyle = 'black'
	ctx.font="18px monospace"
	ctx.textAlign="center"
	ctx.textBaseline="middle"
	const w = e[ 2 ].split( '\n' )
	switch ( w.length ) {
	case 1:
		ctx.fillText( w[ 0 ], ...Mid( e ), e[ 1 ][ 2 ] )
		break;
	default:
		const wMid = Mid( e )
		wMid[ 1 ] -= e[ 1 ][ 3 ] / 6
		ctx.fillText( w[ 0 ], ...wMid, e[ 1 ][ 2 ] )
		wMid[ 1 ] += e[ 1 ][ 3 ] / 3
		ctx.fillText( w[ 1 ], ...wMid, e[ 1 ][ 2 ] )
		break;
	}
}

function
Draw() {

	const canvas = Q( 'canvas' )
	const ctx = canvas.getContext( '2d' )
	ctx.clearRect( 0, 0, canvas.width, canvas.height )

	const drawLine = ( w, m, l ) => {
		ctx.beginPath()
		ctx.moveTo( ...m )
		ctx.lineTo( ...l )
		switch ( w ) {
		case 'std'	: ctx.setLineDash( [] )		; break
		case 'arg'	: ctx.setLineDash( [ 2 ] )		; break
		case 'auto'	: ctx.setLineDash( [ 10, 5 ] )	; break
		}
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
		ctx.fill()
		ctx.beginPath()
		ctx.arc( midX, midY, 16, 0, Math.PI * 2, false )
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
				ctx.fillText(
					"" + ( i + 1 )
				,	( w1[ 0 ] + w2[ 0 ] ) / 2 - Math.cos( slope1 ) * 8
				,	( w1[ 1 ] + w2[ 1 ] ) / 2 - Math.sin( slope1 ) * 8
				)
			}
			break
		case 'file'		:
			DrawFile( ctx, e )
			break
		case 'comm'		:
			DrawComment( ctx, e )
			break
		}
	}
	if ( ! c ) return	//	c must be set
	if ( b ) {	//	Dragging
		const drawDragRect = r => {
			switch ( s[ 0 ] ) {
			case 'file'	:
				FileShape( ctx, ...r )
				ctx.stroke()
				break
			default:
				ctx.strokeRect( ...r )
				break
			}
		}
		let	[ key, where ] = Hit( b )
		if ( ! key ) return
		ctx.strokeStyle = 'red'
		const s = elements[ key ]
		switch ( mode ) {
		case 'select':
			switch ( where ) {
			case 'CC':
				drawDragRect( Move( s[ 1 ] ) )
				break
			default:
				drawDragRect( Morph( s[ 1 ], where ) )
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
	ctx.strokeStyle = 'black'
}
function
Move( r ) {
	return [ r[ 0 ] + c.offsetX - b.offsetX, r[ 1 ] + c.offsetY - b.offsetY, r[ 2 ], r[ 3 ] ]
}
function
Morph( r, where ) {
	let	minX = r[ 0 ]
	let	maxX = r[ 0 ] + r[ 2 ]
	let	minY = r[ 1 ]
	let	maxY = r[ 1 ] + r[ 3 ]
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
	return [ minX, minY, maxX - minX, maxY - minY ]
}
function
HitLine( _ ) {
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
function
Hit( _ ) {
	const x = _.offsetX
	const y = _.offsetY
	for ( let key in elements ) {
		const r = elements[ key ][ 1 ]
		let	minX = r[ 0 ]
		let	maxX = r[ 0 ] + r[ 2 ]
		let	minY = r[ 1 ]
		let	maxY = r[ 1 ] + r[ 3 ]
		let w = (
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
		if ( w.length == 2 ) return [ key, w ]
	}
	return [ null, null ]
}
function
HitInner( _ ) {
	const [ key, w ] = Hit( _ )
	return key && w == 'CC' ? key : null
}

//	Event Handlers

const
MouseDown = () => {
	b = event
	Draw()
}

const
MouseMove = () => {
	c = event
	Draw()
}

const
MouseUp = () => {
	switch ( mode ) {
	case 'select'	:
		if ( b ) {
			const [ key, where ] = Hit( b )
			if ( key ) {
				switch ( where ) {
				case 'CC':
					MoveElement( [ key, Move( elements[ key ][ 1 ] ) ] )
					break
				default:
					MoveElement( [ key, Morph( elements[ key ][ 1 ], where ) ] )
					break
				}
			}
		}
		break
	case 'std'		:
	case 'arg'		:
	case 'auto'		:
		const wB = HitInner( b ); if ( ! wB ) return
		const wC = HitInner( c ); if ( ! wC ) return
		/*
		if ( relations.reduce( ( a, _ ) => a ? a : _[ 1 ] == wC && _[ 2 ] == 'std', false ) ) {
			alert( "Has Stdin" )
			return
		}
		*/
		AddRelation( [ wB, wC, mode ] )
		break
	case 'file'		:
	case 'sh'		:
	case 'batch'	:
	case 'python2'	:
	case 'python3'	:
	case 'node'		:
		const rect = [ event.offsetX - 80, event.offsetY - 30, 160, 60 ]
		const ta = E( 'textarea', { cols: '128', rows: '20' } )
		const
		Close = () => {
			HTMLDialog.close()
			HTMLDialog.parentNode.removeChild( HTMLDialog )
		}
		const
		Create = () => {
			Close()
			AddElement( [ mode, rect, ta.value ] )
		}
		HTMLDialog = E(
			'dialog'
		,	{ center: true }
		,	[	ta
			,	E( 'br' )
			,	B( 'OK', _ => Create() )
			,	B( 'Cancel', _ => Close() )
			]
		)
		document.body.appendChild( HTMLDialog )
		HTMLDialog.showModal()
		break
	}

//
	b = null
	Draw()
}

let file = new URLSearchParams( window.location.search ).get( 'file' )
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

window.addEventListener(
	'DOMContentLoaded'
,	() => {
		const canvas = Q( 'canvas' )
		canvas.addEventListener(
			'contextmenu'
		,	ev => {
				const cm = new remote.Menu()
				cm.append(
					new remote.MenuItem(
						{	label: 'Delete'
						,	click: () => console.log( 'Delete' )
						}
					)
				)
				cm.append(
					new remote.MenuItem(
						{	label: 'Run'
						,	click: () => console.log( 'Run' )
						}
					)
				)
				cm.popup()
			}
		)
		canvas.addEventListener( 'mousedown', MouseDown	)
		canvas.addEventListener( 'mousemove', MouseMove	)
		canvas.addEventListener( 'mouseup'	, MouseUp	)

		Q( '#modeSelect'	).addEventListener( 'click', () => mode = 'select'	)
		Q( '#modeFile'		).addEventListener( 'click', () => mode = 'file'	)
		Q( '#modeSh'		).addEventListener( 'click', () => mode = 'sh'		)
		Q( '#modeBatch'		).addEventListener( 'click', () => mode = 'batch'	)
		Q( '#modePython2'	).addEventListener( 'click', () => mode = 'python2'	)
		Q( '#modePython3'	).addEventListener( 'click', () => mode = 'python3'	)
		Q( '#modeNode'		).addEventListener( 'click', () => mode = 'node'	)
		Q( '#modeStd'		).addEventListener( 'click', () => mode = 'std'		)
		Q( '#modeArg'		).addEventListener( 'click', () => mode = 'arg'		)
		Q( '#modeAuto'		).addEventListener( 'click', () => mode = 'auto'	)
	}
)

