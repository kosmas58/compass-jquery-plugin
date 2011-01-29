compass-jquery-plugin
=====================

Get gem from [Gemcutter][1].

Get source from [github][2].

Description
-----------

A Sass-based Meta-Framework for Compass that allows you to mix and match any of the following:

* jRails with jQuery 1.4.4 and jQuery.UI 1.8.9 including themes
* jQuery Tools 1.2.5
* jquery.jstree.js V1.0rc3
* jquery.dynatree.js V1.0.2
* jquery.ribbon.js
* jquery.jqGrid.js V3.8.2 (with minor changes to make in RESTful)
* jquery.mobile.js 1.0a2
* jquery.jqtouch.js V1.0b2

This library requires [Compass][3].

For the moment this plugin supports Rails 2.3.

An upgrade to Rails 3.x is planned, but depends on the upgrade of compass which actually has alpha state.

*Hint: When trying to build the gem under Windows, bundler can't locate the rakfile. Apply the patch from [Arve Knudsen][4] to fix it.*

jRails, jQuery and jQuery.UI including themes
---------------------------------------------

Use compass to install the jRails, jQuery and jQuery.UI javascript library including themes into your project.

For jQuery:
<pre>compass install [-r jquery] jquery/jquery <project name></pre>

You will find all the stylesheets in easy-to-read Sass format at:

<pre>stylesheets/jquery.ui</pre>

To use the localized stylesheets and javacripts for jQuery include (using the rails_xss plugin):

<pre>
= stylesheet_link_tag "compiled/jquery/ui/[theme].css", :media => 'screen, projection'
= javascript_include_tag :jquery_ui
= javascript_include_tag :jrails
= raw jquery_javascripts(I18n.locale)</pre>

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


jQTouch
-------

Use compass to install the jQTouch javascript library into your project.

<pre>compass install [-r jquery] jquery/jqtouch <project name></pre>

You will find all the stylesheets in easy-to-read Sass format at:

<pre>stylesheets/jqtouch</pre>

To use the localized stylesheets and javacripts include:

<pre>
= stylesheet_link_tag 'compiled/jquery/touch/[theme].css', :media => 'screen, projection'
= javascript_include_tag :jqtouch'</pre>


Thanks to the Contributors:
===========================

Rails:
------

* aaron for [jRails][5]
* David Turnbull for [compass-jquery][6]
* Jonathan Linowes for [gridify][7]
* ahe for [2dc_jqgrid][8]
* scrubber for [jquery_grid_for_rails][9]
* ariesroyaal for [secret_sauce][10] now [at][11].
* Ryan Heath for [pretty_flash][12].

jQuery Plugins included:
------------------------

* Chris Domigan for [jQuery ContextMenu Plugin][13]
* Kalus Hartl for [jQuery Cookie Plugin][14]
* Martin Wendt for [jQuery Dynatree Plugin][15]
* John Reisig et. al. for [jQuery Form Plugin][16]
* Tony Tomov for [jQuery Grid Plugin][17]
* Tim Caswell for [jQuery haml Plugin][18]
* Takayuki Miwa for [jQuery history plugin][19]
* Ivan Bozhanov for [jQuery jsTree Plugin][20]
* Fabrizio Balliano and Fabrizio Balliano for [jQuery Layout Plugin][21]
* Brandon Aaron and Fabrizio Balliano for [jQuery Mousewheel Plugin][21]
* Yehuda Katz for [jQuery Offline Plugin][34]
* Andreas Eberhard for [jQuery PngFix Plugin][22] (for IE)
* Mikael Soederstroem for [jQuery Ribbon Plugin][23]
* Gareth Watts from Splunk Inc for [jQuery Sparklines plugin][24]
* Denis Howlett for [jQuery Table Drag and Drop Plugin][25]
* John Reisig et. al. for [jQuery Templating Plugin][26]
* Juan G. Hurtado for [jQuery TOOLS][27]
* Michael Aufreiter for [jQuery UI Multiselect Plugin][28]
* Andrew M Andrews III for [Any+Time][29]
* Steven Wittens for [Farbtastic Colorpicker plugin][30]
* Adam Shaw for [FullCalendar][31]

Other stuff included:
---------------------

* Tim Caswell for [halm-js][32]. Server side templating language for JavaScript.
* Rick DeNatale for [ri_cal][33]

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

Copyright &copy; 2009-2011 Kosmas Schuetz. See LICENSE for details.

  [1]: http://gemcutter.org/gems/compass-jquery-plugin
  [2]: http://github.com/kosmas58/compass-jquery-plugin
  [3]: http://wiki.github.com/chriseppstein/compass
  [4]: http://groups.google.com/group/ruby-bundler/msg/e375ee77b225609f
  [5]: http://code.google.com/p/ennerchi/
  [6]: http://github.com/dturnbull/compass-jquery/tree/master
  [7]: http://github.com/linoj/gridify
  [8]: http://github.com/ahe/2dc_jqgrid/tree/master
  [9]: http://github.com/scrubber/jquery_grid_for_rails/tree/master
  [10]: http://github.com/ariesroyaal/secret_sauce/tree/master
  [11]: http://github.com/fugufish/secret_sauce
  [12]: http://github.com/rpheath/pretty_flash
  [13]: http://www.trendskitchens.co.nz/jquery/contextmenu/
  [14]: http://stilbuero.de
  [15]: http://www.wwwendt.de
  [16]: http://malsup.com/jquery/form/
  [17]: http://www.trirand.com/blog/
  [18]: http://github.com/creationix/jquery-haml
  [19]: http://tkyk.github.com/jquery-history-plugin/
  [20]: http://jstree.com/
  [21]: http://www.fabrizioballiano.net/
  [22]: :http://jquery.andreaseberhard.de/
  [23]: http://jqueryribbon.codeplex.com/
  [24]: http://omnipotent.net/jquery.sparkline/
  [25]: http://www.isocra.com/2008/02/table-drag-and-drop-jquery-plugin/
  [26]: https://github.com/jquery/jquery-tmpl/
  [27]: http://github.com/jquerytools/jquerytools
  [28]: http://quasipartikel.at
  [29]: http://www.ama3.com/anytime/
  [30]: http://acko.net/dev/farbtastic
  [31]: http://arshaw.com/fullcalendar/
  [32]: http://github.com/creationix/haml-js
  [33]: http://github.com/rubyredrick/ri_cal/
  [34]: http://github.com/wycats/jquery-offline
  [35]: http://github.com/brandonaaron/jquery-mousewheel
  