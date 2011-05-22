// ----------------------------------------------------------------------------
// markItUp!
// ----------------------------------------------------------------------------
// Copyright (C) 2008 Jay Salvat
// http://markitup.jaysalvat.com/
// ----------------------------------------------------------------------------
// Texy! set by Peter Kahoun
// http://kahi.cz
// ----------------------------------------------------------------------------
// Texy!
// http://texy.info
// Feel free to do anything with this.
// -------------------------------------------------------------------
mySettings = {
  nameSpace:          "texy", // Useful to prevent multi-instances CSS conflict
	previewParserPath:	'', // path to your Texy parser
	onShiftEnter:	      {keepDefault:false, replaceWith:'\n\n'},
	markupSet: [	 
		{name:'Heading 1', key:'1', closeWith:function(markItUp) { return miu.texyTitle(markItUp, '#') }, placeHolder:'Your title here...', className:'h1'},
		{name:'Heading 2', key:'2', closeWith:function(markItUp) { return miu.texyTitle(markItUp, '*') }, placeHolder:'Your title here...', className:'h2'},
		{name:'Heading 3', key:'3', closeWith:function(markItUp) { return miu.texyTitle(markItUp, '=') }, placeHolder:'Your title here...', className:'h3'},
		{name:'Heading 4', key:'4', closeWith:function(markItUp) { return miu.texyTitle(markItUp, '-') }, placeHolder:'Your title here...', className:'h4'},
		{separator:'---------------' },
		{name:'Bold', key:'B', closeWith:'**', openWith:'**', className:'bold', placeHolder:'Your text here...'}, 
		{name:'Italic', key:'I', closeWith:'*', openWith:'*', className:'italic', placeHolder:'Your text here...'}, 
		{separator:'---------------' },
		{name:'Bulleted list', openWith:'- ', className:'list-bullet'}, 
		{name:'Numeric list', openWith:function(markItUp) { return markItUp.line+'. '; }, className:'list-numeric'}, 
		{separator:'---------------' },
		{name:'Picture', openWith:'[* ', closeWith:' (!(.([![Alt text]!]))!) *]', placeHolder:'[![Url:!:http://]!]', className:'image'}, 
		{name:'Link', openWith:'"', closeWith:'":[![Url:!:http://]!]', placeHolder:'Your text to link...', className:'link' },
		{separator:'---------------' },
		{name:'Quotes', openWith:'> ', className:'quotes'},
		{name:'Code block/Code in-line', openWith:'(!(/---[![Language:!:html]!]\n|!|`)!)', closeWith:'(!(\n\\---\n|!|`)!)', className:'code'},
		{name:'Texy off', closeWith:'\'\'', openWith:'\'\'', className:'off', placeHolder:'No texty! in here!'},		
 		{separator:'---------------' },	   
		{name:'Preview', call:'preview', className:'preview'}
	]
}

miu = {
	texyTitle: function (markItUp, chr) {
		heading = '';
		n = $.trim(markItUp.selection || markItUp.placeHolder).length;
		for(i = 0; i < n; i++)	{
			heading += chr;
		}
		return '\n'+heading;
	}
}


