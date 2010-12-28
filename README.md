compass-jquery-plugin
=====================

Get gem from [Gemcutter][1].

Get source from [github][2].

Description
-----------

A Sass-based Meta-Framework for Compass that allows you to mix and match any of the following:

* jRails with jQuery 1.4.4 and jQuery.UI 1.8.7 including themes
* jQuery Tools 1.2.5
* jquery.jstree.js V1.0rc3
* jquery.dynatree.js V1.0.2
* jquery.ribbon.js
* jquery.jqGrid.js V3.8.2 (with minor changes to make in RESTful)
* jquery.mobile.js 1.0a2

This library requires [Compass][3].

jRails, jQuery and jQuery.UI including themes
---------------------------------------------

Use compass to install the jRails, jQuery and jQuery.UI javascript library including themes into your project.

For jQuery:
<pre>compass install [-r jquery] jquery/jrails <project name></pre>

You will find all the stylesheets in easy-to-read Sass format at:

<pre>stylesheets/jquery.ui</pre>

To use the localized stylesheets and javacripts for jQuery include (using the rails_xss plugin):

<pre>
= stylesheet_link_tag "compiled/jquery/ui/[theme].css", :media => 'screen, projection'
= javascript_include_tag :defaults
= raw jrails_javascripts(I18n.locale)</pre>

alternatively you can include: 
<pre>
= stylesheet_link_tag "compiled/jquery/ui/[theme].css", :media => 'screen, projection'
= javascript_include_tag :jquery_ui
= javascript_include_tag :jrails
= raw jrails_javascripts(I18n.locale)</pre>

into your layouts.

jQuery TOOLS
------------

Use compass to install the jQuery TOOLS javascript library into your project.

<pre>compass install [-r jquery] jquery/tools <project name></pre>

To use the javacripts include:

<pre>
= javascript_include_tag :tools</pre>

jQuery Dynatree Plugin
----------------------

Use compass to install the jQuery Dynatree javascript library into your project.

<pre>compass install [-r jquery] jquery/dynatree <project name></pre>

You will find all the stylesheets in easy-to-read Sass format at:

<pre>stylesheets/jquery.ui</pre>

To use the localized stylesheets and javacripts include:

<pre>
= stylesheet_link_tag 'compiled/jquery/dynatree/[skin].css', :media => 'screen, projection'
= javascript_include_tag :dynatree</pre>

jQuery jsTree Plugin
--------------------

Use compass to install the jQuery jsTree javascript library into your project.

<pre>compass install [-r jquery] jquery/jstree <project name></pre>

You will find all the stylesheets in easy-to-read Sass format at:

<pre>stylesheets/jquery.ui</pre>

To use the localized stylesheets and javacripts include:

<pre>
= stylesheet_link_tag 'compiled/jquery/jstree/[theme].css', :media => 'screen, projection'
= javascript_include_tag :jstree</pre>

jQuery Ribbon Plugin
--------------------

Use compass to install the jQuery Ribbon javascript library into your project.

<pre>compass install [-r jquery] jquery/ribbon <project name></pre>

You will find all the stylesheets in easy-to-read Sass format at:

<pre>stylesheets/jquery.ui</pre>

To use the localized stylesheets and javacripts include:

<pre>
= stylesheet_link_tag 'compiled/jquery/ribbon/[theme].css', :media => 'screen, projection'
= javascript_include_tag :ribbon</pre>

jqGrid
------

Use compass to install the jqGrid javascript library into your project.

<pre>compass install [-r jquery] jquery/jqgrid <project name></pre>

You will find the jqGrid stylesheet in easy-to-read Sass format at:

<pre>stylesheets/jquery.ui</pre>

To use the localized stylesheets and javacripts include:

<pre>
= stylesheet_link_tag 'compiled/jquery/jqGrid.css', :media => 'screen, projection'
= raw jqgrid_javascripts(I18n.locale)</pre>

Secret Sauce
------------

Use compass to install the Secret Sauce for jqGrid javascript library into your project.

<pre>compass install [-r jquery] jquery/secret_sauce <project name></pre>

You will find all the stylesheets in easy-to-read Sass format.

<pre>stylesheets/jquery.ui</pre>

To use the localized stylesheets and javacripts include:

<pre>
= stylesheet_link_tag 'compiled/jquery/secret_sauce.css', :media => 'screen, projection'
= javascript_include_tag :secret_sauce</pre>

jquery.ical
-----------

Use compass to install the jquery.ical javascript library into your project.

<pre>compass install [-r jquery] jquery/ical <project name></pre>

You will find all the stylesheets in easy-to-read Sass format.

<pre>stylesheets/jquery.ui</pre>

To use the (localized) stylesheets and javacripts include:

<pre>
  = stylesheet_link_tag 'compiled/jquery/ical.css', :media => 'screen, projection'
  = javascript_include_tag :ical</pre>

Emulators
---------

Use compass to install the emulator stylesheets and fullsize images for iPhone and iPad into your project.

<pre>compass install [-r jquery] jquery/emulators <project name></pre>

You will find all the stylesheets in easy-to-read Sass format at:

<pre>stylesheets/emulators</pre>

To use the localized stylesheets and javacripts include:

<pre>
= stylesheet_link_tag 'compiled/emulators/ipad.landscape.css', :media => 'screen, projection'
= stylesheet_link_tag 'compiled/emulators/iphone.portrait.css', :media => 'screen, projection'</pre>

jQuery mobile
-------------

Use compass to install the jQuery mobile javascript library and themes into your project.

<pre>compass install [-r jquery] jquery/mobile <project name></pre>

You will find all the stylesheets in easy-to-read Sass format at:

<pre>stylesheets/mobile</pre>

To use the localized stylesheets and javacripts include:

<pre>
= stylesheet_link_tag "compiled/jquery/mobile/[theme].css", :media => 'screen, projection'
= javascript_include_tag :mobile'</pre>


Thanks to the Contributors:
===========================

Rails:
------

* aaron for [jRails][4]
* David Turnbull for [compass-jquery][5]
* Jonathan Linowes for [gridify][6]
* ahe for [2dc_jqgrid][7]
* scrubber for [jquery_grid_for_rails][8]
* ariesroyaal for [secret_sauce][9] now [at][10].
* Ryan Heath for [pretty_flash][11].

jQuery Plugins included:
------------------------

* Chris Domigan for [jQuery ContextMenu Plugin][12]
* Kalus Hartl for [jQuery Cookie Plugin][13]
* Martin Wendt for [jQuery Dynatree Plugin][14]
* John Reisig et. al. for [jQuery Form Plugin][15]
* Tony Tomov for [jQuery Grid Plugin][16]
* Tim Caswell for [jQuery haml Plugin][17]
* Takayuki Miwa for [jQuery history plugin][18]
* Ivan Bozhanov for [jQuery jsTree Plugin][19]
* Fabrizio Balliano and Fabrizio Balliano for [jQuery Layout Plugin][20]
* Andreas Eberhard for [jQuery PngFix Plugin][21] (for IE)
* Mikael Soederstroem for [jQuery Ribbon Plugin][22]
* Gareth Watts from Splunk Inc for [jQuery Sparklines plugin][23]
* Denis Howlett for [jQuery Table Drag and Drop Plugin][24]
* John Reisig et. al. for [jQuery Templating Plugin][25]
* Juan G. Hurtado for [jQuery TOOLS][26]
* Michael Aufreiter for [jQuery UI Multiselect Plugin][27]
* Andrew M Andrews III for [Any+Time][28]
* Steven Wittens for [Farbtastic Colorpicker plugin][29]
* Adam Shaw for [FullCalendar][30]

Other stuff included:
---------------------

* Tim Caswell for [halm-js][31]. Server side templating language for JavaScript.
* Rick DeNatale for [ri_cal][32]

Note on Patches/Pull Requests
=============================

* Fork the project.
* Make your feature addition or bug fix.
* Add tests for it. This is important so I don't break it in a
  future version unintentionally.
* Commit, do not mess with rakefile, version, or history.
  (if you want to have your own version, that is fine but
   bump version in a commit by itself I can ignore when I pull)
* Send me a pull request. Bonus points for topic branches.

Copyright
=========

Copyright (c) 2009-2010 Kosmas Schuetz. See LICENSE for details.

  [1]: http://gemcutter.org/gems/compass-jquery-plugin
  [2]: http://github.com/kosmas58/compass-jquery-plugin
  [3]: http://wiki.github.com/chriseppstein/compass
  [4]: http://code.google.com/p/ennerchi/
  [5]: http://github.com/dturnbull/compass-jquery/tree/master
  [6]: http://github.com/linoj/gridify
  [7]: http://github.com/ahe/2dc_jqgrid/tree/master
  [8]: http://github.com/scrubber/jquery_grid_for_rails/tree/master
  [9]: http://github.com/ariesroyaal/secret_sauce/tree/master
  [10]: http://github.com/fugufish/secret_sauce
  [11]: http://github.com/rpheath/pretty_flash
  [12]: http://www.trendskitchens.co.nz/jquery/contextmenu/
  [13]: http://stilbuero.de
  [14]: http://www.wwwendt.de
  [15]: http://malsup.com/jquery/form/
  [16]: http://www.trirand.com/blog/
  [17]: http://github.com/creationix/jquery-haml
  [18]: http://tkyk.github.com/jquery-history-plugin/
  [19]: http://jstree.com/
  [20]: http://www.fabrizioballiano.net/
  [21]: :http://jquery.andreaseberhard.de/
  [22]: http://jqueryribbon.codeplex.com/
  [23]: http://omnipotent.net/jquery.sparkline/
  [24]: http://www.isocra.com/2008/02/table-drag-and-drop-jquery-plugin/
  [25]: https://github.com/jquery/jquery-tmpl/
  [26]: http://github.com/jquerytools/jquerytools
  [27]: http://quasipartikel.at
  [28]: http://www.ama3.com/anytime/
  [29]: http://acko.net/dev/farbtastic
  [30]: http://arshaw.com/fullcalendar/
  [31]: http://github.com/creationix/haml-js
  [32]: http://github.com/rubyredrick/ri_cal/
