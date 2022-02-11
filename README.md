# PikaJS-DatePicker

Datepicker plugin for PikaJS that is **11.2KB** minified. Yeah, it's hard to make a datepicker teeny-tiny... They're complicated.

## What is PikaJS?

[PikaJS](https://github.com/Scottie35/PikaJS) is a client-side scripting library like jQuery, but 7 times smaller, faster, and more efficient.

**You must include PikaJS before adding PikaJS Hotkeys to your page!**

## What does it do?

The Pika DatePicker plugin turns ordinary INPUT text fields into fancy ones. You're probably thinking, "Dude, why not just use an INPUT field with type='date'?"

Well, browser support is much better these days, but there are still numerous issues and varied user interfaces. With DatePicker, the field works the same on all platforms.

Plus, the date format is often based on the browser locale, which may not be what you want. Again, support varies...

Finally, no matter what type of field you use, you still usually need to format and verify the input on the server side. So why not keep it simple *and* consistent?

### .datePicker

First, include a text INPUT field on your page:

    <input id="mydate" type="text">

Then, inside DOMloaded, do this:

    // PikaJS DOM loaded
    $(function() {
      // ...
      $('input#mydate').datePicker();
      // ...
    });

You can pass options to `.datePicker` if you want. Any options you pass will override the `defaults`, which are:

	$.datePicker.defaults = {
		month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		short_month_names: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		short_day_names: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
		start_of_week: 0,
		selectable_days: [0, 1, 2, 3, 4, 5, 6],
		weekend_days: [0,6],
		non_selectable: [],
		short_non_selectable: [],
		date_format: 'dd MM YYYY',
		date_min: '',
		date_max: '',
		error_out_of_range: 'Selected date is out of range',
		on_show: null,
		on_open: null,
		on_select: null,
		on_close: null
	}

These options allow you to set just about everything.

- `month_names` - An array of month names (override to translate into another language)
- `short_month_names` - Well, duh!
- `short_day_names` - Will be displayed at the top of each column in the calendar
- `start_of_week` - integer representing day of week; Default 0 = Sunday
- `selectable_days` - Array of valid days; 0 = Sunday, 6 = Saturday; Begins with `start_of_week`
- `weekend_days` - Array of weekend days (shaded on calendar); Defaults to Sunday & Saturday
- `non_selectable` - Non-selectable dates (like holidays) including the year in `date_format`
- `short_non_selectable` - Non-selectable dates (like holidays) **excluding** the year in `date_format`
- `date_format` - String representing date format; Must be one of the following:
    - 'dd MM YYYY' = 11 Feb 2022
    - 'dd FF YYYY' = 11 February 2022
    - 'MM dd YYYY' = Feb 11 2022
    - 'FF dd YYYY' = February 11 2022
    - 'dd/mm/YYYY' = 11/02/2022
    - 'YYYY/mm/dd' = 2022/02/11
- `date_min` - String for minimum date in `date_format`
- `date_max` - String for maximum date in `date_format`
- `error_out_of_rage` - Displayed when invalid date is selected
- `on_show` - *Optional* function to position/open calendar yourself (this = datepicker obj, args[0] = cal DIV)
- `on_open` - *Optional* callback run after calendar is opened
- `on_select` - *Optional* callback run after a day is selected (this = datepicker obj, args[0] = Date chosen)
- `on_close` - *Optional* callback run after cal is closed
  
#### Whiz-bang Functionality

By default, DatePicker will open the calendar directly above or below the INPUT field. It will intelligently position the calendar so that it's not partially outside the browser viewport. IOW, if your INPUT field as at the bottom of the viewable area of the screen, DatePicker will detect that and open it *above* the INPUT field.

You can also open the calendar and position it yourself using `on_show` (which cancels the above built-in functionality automatically).

Add in some optional `.on_open`, `.on_select`, and `.on_close` callback functions, and you can run your own JS code to do whatever you want at every stage of the date picking process. This makes Pika DatePicker much more powerful and flexible compared to many other JS date pickers.

Next, the size of the popup calendar is determined by the *width* of the INPUT element. This means that the DatePicker popup is responsive and auto-sized when `.datePicker` is called on the INPUT element.

In addition to the right/left arrow buttons for the Month and Year on the calendar, you can also click the month or year text to use a pulldown SELECT list instead.

Finally, DatePicker supports the following keystrokes for navigating in the popup calendar:

- **Tab** / **Esc** - Hide the calendar
- **Up** - Move back by 1 week
- **Down** - Move forward by 1 week
- **Left** - Move back by 1 day
- **Right** - Move forward by 1 day
- **PageUp** - Go back 1 month
- **PageDown** - Go forward 1 month
- **Enter** - select the current date

Note that these keystrokes are only active inside the popup calendar and won't interfere with other key handlers you may have set up.
		
#### Styling the Calendar

The file `pika-datepicker.css` contains the default styles for the calendar. Customize away!

#### Final Notes

You can run `.datePicker` on any number of INPUT fields on a given page.

In fact, you can pass a PikaJS Object of any numer of INPUT elements, and each of them will be datePicker-ified.

While DatePicker validates the format and range of the date based on the options given, don't forget to validate the date and convert it server-side into the proper format for database storage!

**That's all, folks!**
