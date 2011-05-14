// -------------------------------------------------------------------
// markItUp!
// --------------------------------------------------------------------
// Copyright (C) 2008 Jay Salvat
// http://markitup.jaysalvat.com/
// -------------------------------------------------------------------
// Dotclear Wiki tags example
// -------------------------------------------------------------------
// Feel free to add more tags
// -------------------------------------------------------------------
mySettings = {
	previewParserPath:	'', // path to your DotClear parser
	onShiftEnter:		{keepDefault:false, replaceWith:'%%%\n'},
	onCtrlEnter:		{keepDefault:false, replaceWith:'\n\n'},
	markupSet: [
		{name:'Heading 1', key:'1', openWith:'!!!!!', placeHolder:'Your title here...' },
		{name:'Heading 2', key:'2', openWith:'!!!!', placeHolder:'Your title here...' },
		{name:'Heading 3', key:'3', openWith:'!!!', placeHolder:'Your title here...' },
		{name:'Heading 4', key:'4', openWith:'!!', placeHolder:'Your title here...' },
		{name:'Heading 5', key:'5', openWith:'!', placeHolder:'Your title here...' },
		{separator:'---------------' },
		{name:'Bold', key:'B', openWith:'__', closeWith:'__'}, 
		{name:'Italic', key:'I', openWith:"''", closeWith:"''"}, 
		{name:'Stroke through', key:'S', openWith:'--', closeWith:'--'}, 
		{separator:'---------------' },
		{name:'Bulleted list', openWith:'(!(* |!|*)!)'}, 
		{name:'Numeric list', openWith:'(!(# |!|#)!)'}, 
		{separator:'---------------' },
		{name:'Picture', key:"P", replaceWith:'(([![Url:!:http://]!]|[![Alternative text]!](!(|[![Position:!:L]!])!)))'}, 
		{name:'Link', key:"L", openWith:"[", closeWith:'|[![Url:!:http://]!]|[![Language:!:en]!]|[![Title]!]]', placeHolder:'Your text to link here...' }, 
		{separator:'---------------' },
		{name:'Quotes', openWith:'{{', closeWith:'}}'}, 
		{name:'Code', openWith:'@@', closeWith:'@@'}, 
		{separator:'---------------' },
		{name:'Preview', call:'preview', className:'preview'}
	]
}