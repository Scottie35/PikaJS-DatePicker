/** 
 *	@license PikaJS DatePicker plugin 1.0.1
 *	© 2022 Scott Ogrin
 * 	MIT License
 */

(function($, gD, gM, gFY) {

	$.datePicker = {
		Version: '1.0.1',
		defaults: {
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
			on_show: null,			// Function so you can position/open cal yourself (this = datepicker obj, args[0] = cal DIV)
			on_open: null,			// Callback run after cal is opened
			on_select: null,		// Callback run after day is selected (this = datepicker obj, args[0] = Date chosen)
			on_close: null 			// Callback run after cal is closed
		}
	};

	// Initialize
	function datePicker(el, opts) {
		if (!$.t(opts, 'o')) opts = {};
		$.extend(this, $.datePicker.defaults, opts);
		this.input = $(el);
		this.input.wrap('<div class="datepicker_w">');
		this.cal = this.input.up('.datepicker_w');
		// Each cal instance has a random ID for temporary event listeners
		this.randID = $.R();
		this.pauseEvents = false;
		this.build();
		this.selectDate();
		this.hideCal();
	}

	// Here, this/that = datePicker object, that.input = input field, this.cal = the input field's .datepicker_w wrapper
	datePicker.prototype = {

		build: function() {
			var that = this;
			this.reg = this.dateSetReg();
			this.date_max = (this.date_max != '' && this.date_max.match(this.reg)) ? this.dateDecode(this.date_max.match(this.reg)) : '';
			this.date_min = (this.date_min != '' && this.date_min.match(this.reg)) ? this.dateDecode(this.date_min.match(this.reg)) : '';
			// Build rest of HTML as DocumentFragment (due to table content insert being wonky)
			var html = '<div class="date_selector"><div class="nav"><div class="error_msg" style="display: none;"></div><p class="month_nav"><span class="button prev" title="[Page-Up]">&#8249;</span> <span class="month_name"></span> <span class="button next" title="[Page-Down]">&#8250;</span></p><p class="year_nav"><span class="button prev" title="[Ctrl+Page-Up]">&#8249;</span> <span class="year_name"></span> <span class="button next" title="[Ctrl+Page-Down]">&#8250;</span></p></div><div class="calendar"><div class="head"></div><div class="body"></div></div></div><div class="cal-btn"></div></div>';
			this.cal.append(html);
			// Insert single-letter day names on calendar header
			var letterDays = '';
			$.each(this.adjustDays(this.short_day_names), function(i, val) {
				letterDays += '<div>' + val + '</div>';
			});
			this.cal.find('.head').html(letterDays);
			// Populate calendar with input or current Date
			this.selectDate();
			// Adjust cal size based on input field (now and if window is resized!)
			datsel = this.cal.find('.date_selector');
			$(window).on('resize', function() {
				datsel.css({opacity: 0}).show();
				if (that.input.width() > 210) {
					var padbord = parseInt(datsel.css('padding-right')) + parseInt(datsel.css('padding-left')) + parseInt(datsel.css('border-right-width')) + parseInt(datsel.css('border-left-width'));
					datsel.css({width: that.input.width() - padbord + 'px'});
					var cellht = datsel.find('.selectable_day').first().height();
					// Default cellht = 30px at calwd = 210px; Increase font em by 0.02 per extra px height
					if (cellht > 30) {
						that.cal.css({'font-size': 1 + 0.02 * (cellht - 30) + 'em'});					
					}
				}
				datsel.hide().css({opacity: ''});
			});
			window.dispatchEvent(new Event('resize'));
			// Attach Event Handlers
			// 'this' is $(el) from Pika ._on(), 'that' is datePicker obj
			this.cal._on('mousedown', '.month_nav .prev', function() {
				that.moveMonthBy(-1);
				return false;
			});
			this.cal._on('mousedown', '.month_nav .next', function() {
				that.moveMonthBy(1);
				return false;
			});
			this.cal._on('mousedown', '.month_name', function() {
				if (this.down('select').length == 0) {
					that.pauseEvents = true;
					that.cal.find('.month_name').html(that.getMonthSelect());
				}
				return false;
			});
			this.cal._on('change', '.month_name select', function() {
				that.moveMonthBy(parseInt(this.val()) - that.currentMonth[gM]());
				that.pauseEvents = false;
				return false;
			});
			this.cal._on('mousedown', '.year_name', function() {
				if (this.down('select').length == 0) {
					that.pauseEvents = true;
					that.cal.find('.year_name').html(that.getYearSelect());
				}
				return false;
			});
			this.cal._on('change', '.year_name select', function() {
				that.moveMonthBy((parseInt(this.val()) - that.currentMonth[gFY]())*12);
				that.pauseEvents = false;
				return false;
			});
			this.cal._on('mousedown', '.year_nav .prev', function() {
				that.moveMonthBy(-12);
				return false;
			});
			this.cal._on('mousedown', '.year_nav .next', function() {
				that.moveMonthBy(12);
				return false;
			});
			this.cal._on('mousedown', '.selectable_day', function() {
				that.changeInput(this.data('date'));
				return false;
			});
			this.cal._on('mouseover', '.selectable_day', function() {
				this.addClass('hover');
				return false;
			});
			this.cal._on('mouseout', '.selectable_day', function() {
				this.removeClass('hover');
				return false;
			});
			// This is for manual keyboard input in field, which should never happen
			this.cal._on('input', 'input:first-of-type', function() {
				if (this.val().match(that.reg) != null) {
					that.selectDate();
				}
				return false;
			});
			this.cal.find('.cal-btn').on('click.calBtn' + this.randID, function(evt) {
				if (that.cal.find('.date_selector').visible()) {
					that.hideCal();	
				} else {
					that.showCal();
				}
			});
		},

		selectMonth: function(date) {
			var newMonth = new Date(date[gFY](), date[gM](), date[gD]());
			if (this.dateAllowed(newMonth)) {
				if (!this.currentMonth || !(this.currentMonth[gFY]() == newMonth[gFY]() && this.currentMonth[gM]() == newMonth[gM]())) {
					this.currentMonth = newMonth;
					var rangeStart = this.rangeStart(date), rangeEnd = this.rangeEnd(date);
					var numDays = this.daysBetween(rangeStart, rangeEnd);
					var dayCells = '';
					for (var i=0; i <= numDays; i++) {
						var currentDay = new Date(rangeStart[gFY](), rangeStart[gM](), rangeStart[gD]() + i, 12, 0);
						if (currentDay.getDay() == this.start_of_week) {
							var firstDayOfWeek = currentDay;
							var lastDayOfWeek = new Date(currentDay[gFY](), currentDay[gM](), currentDay[gD]()+6, 12, 0);
							dayCells += '<div class="week">';
						}
						var klass = 'unselected_month';
						if (currentDay[gM]() == date[gM]() && this.dateAllowed(currentDay) && !this.isHoliday(currentDay)) {
							klass = 'selectable_day';
							if (this.weekend_days.indexOf(currentDay.getDay()) > -1) {
								klass += ' weekend';
							}
						}
						dayCells += '<div class="' + klass + '" data-date="' + this.dateToString(currentDay) + '">' + currentDay[gD]() + '</div>';
						if (currentDay.getDay() == (this.start_of_week + 6) % 7) {
							dayCells += "</div>";
						}
					}
					this.cal.find('.body').html(dayCells);
					this.cal.find('.month_name').html(this.month_names[date[gM]()]);
					this.cal.find('.year_name').html(this.currentMonth[gFY]());
					this.cal.find("div[data-date='" + this.dateToString(new Date()) + "']").addClass("today");
				}
				this.cal.find('.selected').each(function() {
					this.removeClass('selected');
				});
				this.cal.find('div[data-date="' + this.selectedDateString + '"], div[data-date="' + this.selectedDateString + '"]').each(function() {
					this.addClass('selected');
				});
			} else {
				this.show_error(this.error_out_of_range);
			}
		},

		selectDate: function(date) {
			if ($.t(date)) { date = this.stringToDate(this.input.val()); }
			if (!date) { date = new Date(); }
			if (this.dateAllowed(date)) {
				this.selectedDate = date;
				this.currentYear = date[gFY]();
				this.selectedDateString = this.dateToString(this.selectedDate);
				this.selectMonth(this.selectedDate);
			} else if ((this.date_min) && this.daysBetween(this.date_min, date) < 0) {
				this.selectedDate = this.date_min;
				this.selectMonth(this.date_min);
				this.input.val('');
			} else {
				this.selectedDate = this.date_max
				this.selectMonth(this.selectedDate);
				this.input.val('');
			}
		},

		dateAllowed: function(date){
			return (!this.date_min || this.daysBetween(this.date_min, date) >= 0) && (!this.date_max || this.daysBetween(date, this.date_max) >= 0);
		},

		isHoliday: function(date) {
			return (this.selectable_days.indexOf(date.getDay()) == -1 || this.non_selectable.indexOf(this.dateToString(date)) > -1 || this.short_non_selectable.indexOf(this.dateToShortString(date)) > -1);
		},

		changeInput: function(dateString) {
			this.input.val(dateString);
			this.input.blur();
			this.selectDate();
			if (this.input.attr('type') != "hidden") {
				this.hideCal();
			}
			// Custom callback:
			if ($.t(this.on_select, 'f')) {
				this.on_select.call(this, this.selectedDate);
			}
		},

		showCal: function() {
			var that = this;
			this.pauseEvents = that.pauseEvents = false;
			this.cal.find('.error_msg').css({display: 'none'});
			this.input.off('focus.cal' + this.randID);
			this.input.attr('readonly', true);
			// Set position:
			if ($.t(this.on_show, 'f')) {
				// Let user handle position/display for calender
				this.on_show.call(this, this.cal.find('.date_selector'));
			} else {
				var datsel = this.cal.find('.date_selector');
				var offset = this.input.position();
				datsel.css({opacity: 0}).show();
				datsel.css({
					top: offset.top + this.input[0].offsetHeight + 'px',
					left: offset.left + 'px'
				});
				if (datsel.offset().top + datsel.height() > document.documentElement.clientHeight) {
					// calendar is off bottom of screen, so move above input field
					datsel.css({
						top: offset.top - datsel.height() + 'px',
						left: offset.left + 'px'
					});
				}
				datsel.css({opacity: ''});
				// If pos doesn't work:
				if ($.animate) { datsel.scrollTo(); }
			}
			// Temporary Event listeners
			$(document).on('mousedown.calClose' + this.randID, function(evt) {
				if (that.pauseEvents) { return true; }
				if (evt.target != that.input[0] && !that.insideCal(evt) && !$(evt.target).hasClass('cal-btn')) {
					that.hideCal();
				}
				return false;
			});
			$(document).on('keydown.cal' + this.randID, function(evt) {
				if (that.pauseEvents) { return true; }
				switch (evt.keyCode) {
					case 9: // tab
					case 27: // esc
						that.hideCal();
						return;
						break;
					case 13: // enter
						if (that.dateAllowed(that.stringToDate(that.selectedDateString)) && !that.isHoliday(that.stringToDate(that.selectedDateString))) {
							that.changeInput(that.selectedDateString);
						}
						break;
					case 33: // page up
						that.moveDateMonthBy(-1);
						break;
					case 34: // page down
						that.moveDateMonthBy(1);
						break;
					case 38: // up
						that.moveDateBy(-7);
						break;
					case 40: // down
						that.moveDateBy(7);
						break;
					case 37: // left
						that.moveDateBy(-1);
						break;
					case 39: // right
						that.moveDateBy(1);
						break;
					default:
						return true;
				}
				return false;
			});
			// Custom callback:
			if ($.t(that.on_open, 'f')) {
				that.on_open.call(that);
			}
		},

		hideCal: function() {
			var that = this;
			if (this.input.attr('type') != "hidden") {
				this.input.removeAttr('readonly');
				this.cal.find('.date_selector').hide();
				$(document).off('mousedown.calClose' + this.randID);
				$(document).off('keydown.cal' + this.randID);
				this.input.on('focus.cal' + this.randID, function() {
					that.showCal();
				});
				// Custom callback:
				if ($.t(that.on_close, 'f')) {
					that.on_close.call(that);
				}
			}
		},

		insideCal: function(evt) {
			var datsel = this.cal.find('.date_selector'), offset = datsel.offset();
			offset.right = offset.left + datsel[0].offsetWidth;
			offset.bottom = offset.top + datsel[0].offsetHeight;
			return evt.pageY < offset.bottom && evt.pageY > offset.top && evt.pageX < offset.right && evt.pageX > offset.left;
		},

		dateSetReg: function() {
			switch (this.date_format) {
				case "dd/mm/YYYY": 
					return RegExp(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); 
					break;
				case "FF dd YYYY": 
					return new RegExp(/^([a-zA-Z]+) (\d{1,2}) (\d{4})$/); 
					break;
				case "MM dd YYYY": 
					return new RegExp(/^([a-zA-Z]{3}) (\d{1,2}) (\d{4})$/); 
					break;
				case "dd FF YYYY": 
					return new RegExp(/^(\d{1,2}) ([a-zA-Z]+) (\d{4})$/); 
					break;
				case "YYYY/mm/dd": 
					return new RegExp(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/); 
					break;
				case "dd MM YYYY":
				default:
					return new RegExp(/^(\d{1,2}) ([a-zA-Z]{3}) (\d{4})$/); 
					break;
				}
		},

		dateDecode: function(data) {
			switch (this.date_format) {
				case "dd/mm/YYYY": 
					return new Date(data[3], parseInt(data[2]-1), data[1]);
					break;
				case "FF dd YYYY": 
					return new Date(data[3], this.month_names.indexOf(data[1]), data[2]);
					break;
				case "MM dd YYYY": 
					return new Date(data[3], this.short_month_names.indexOf(data[1]), data[2]);
					break;
				case "dd FF YYYY": 
					return new Date(data[3], this.month_names.indexOf(data[2]), data[1]);
					break;
				case "YYYY/mm/dd": 
					return new Date(data[1], parseInt(data[2]-1), data[3]);
					break;
				case "dd MM YYYY":
				default:
					return new Date(data[3], this.short_month_names.indexOf(data[2]), data[1]);
					break;

			}
		},

		stringToDate: function(string) {
			var matches = string.match(this.reg);
			if (matches != null) {
				if (matches[3] == 0 && matches[2] == 0 && matches[1] == 0) {
					return null;	
				} else {
					return this.dateDecode(matches);
				}
			} else {
				return null;
			};
		},

		dateToString: function(date) {
			var dd = this.strpad(date[gD]()), FF = this.month_names[date[gM]()], mm = this.strpad(date[gM]()+1), MM = this.short_month_names[date[gM]()], YYYY = date[gFY]();
			switch (this.date_format) {
				case "dd/mm/YYYY": 
					return dd + "/" + mm + "/" + YYYY;
					break;
				case "FF dd YYYY": 
					return FF + " " + dd + " " + YYYY;
					break;
				case "MM dd YYYY": 
					return MM + " " + dd + " " + YYYY;
					break;
				case "dd FF YYYY": 
					return dd + " " + FF + " " + YYYY;
					break;
				case "YYYY/mm/dd": 
					return YYYY + "/" + mm + "/" + dd;
					break;
				case "dd MM YYYY":
				default:
					return dd + " " + MM + " " + YYYY;
					break;
			}
		},

		dateToShortString: function(date){
			var dd = this.strpad(date[gD]()), FF = this.month_names[date[gM]()], mm = this.strpad(date[gM]()+1), MM = this.short_month_names[date[gM]()];
			switch (this.date_format) {
				case "dd/mm/YYYY": 
					return dd + "/" + mm;
					break;
				case "FF dd YYYY": 
					return FF + " " + dd;
					break;
				case "MM dd YYYY": 
					return MM + " " + dd;
					break;
				case "dd FF YYYY": 
					return dd + " " + FF;
					break;
				case "YYYY/mm/dd": 
					return mm + "/" + dd;
					break;
				case "dd MM YYYY":
				default:
					return dd + " " + MM;
					break;
			}
		},

		moveDateBy: function(amount) {
			var newDate = new Date(this.selectedDate[gFY](), this.selectedDate[gM](), this.selectedDate[gD]() + amount);
			this.selectDate(newDate);
		},

		moveDateMonthBy: function(amount) {
			var newDate = new Date(this.selectedDate[gFY](), this.selectedDate[gM]() + amount, this.selectedDate[gD]());
			if (newDate[gM]() == this.selectedDate[gM]() + amount + 1) {
				newDate.setDate(0);
			};
			this.selectDate(newDate);
		},

		moveMonthBy: function(amount) {
			var amt = (amount < 0) ? amount + 1 : amount;
			var day = (amount < 0) ? -1 : 1;
			this.selectMonth(new Date(this.currentMonth[gFY](), this.currentMonth[gM]() + amt, day));
		},

		getMonthSelect: function() {
			var month_select = '<select>', sel = '';
			for (var i = 0; i < this.month_names.length; i++) {
				if (i == this.currentMonth[gM]()) {
					sel = ' selected="selected"';
				}
				month_select += '<option value="' + i + '"' + sel + '>' + this.month_names[i] + '</option>';
			}
			return month_select + '</select>';
		},

		getYearSelect: function() {
			var year_select = '<select>', sel;
			for (var i = ((this.date_min) ? this.date_min[gFY]() : 1970); i <= ((this.date_max) ? this.date_max[gFY]() : 2100); i++) {
				sel = (i == this.currentMonth[gFY]()) ? ' selected="selected"' : '';
				year_select += '<option value="' + i + '"' + sel + '>' + i + '</option>';
			}
			return year_select + '</select>';
		},

		daysBetween: function(start, end) {
			start = Date.UTC(start[gFY](), start[gM](), start[gD]());
			end = Date.UTC(end[gFY](), end[gM](), end[gD]());
			return (end - start) / 86400000;
		},

		changeDayTo: function(dayOfWeek, date, direction) {
			var difference = direction * (Math.abs(date.getDay() - dayOfWeek - (direction * 7)) % 7);
			return new Date(date[gFY](), date[gM](), date[gD]() + difference);
		},

		rangeStart: function(date) {
			return this.changeDayTo(this.start_of_week, new Date(date[gFY](), date[gM]()), -1);
		},

		rangeEnd: function(date) {
			return this.changeDayTo((this.start_of_week - 1) % 7, new Date(date[gFY](), date[gM]() + 1, 0), 1);
		},

		show_error: function(error) {
			var that = this;
			this.cal.find('.error_msg').html(error).show();
			setTimeout(function() {
				that.cal.find('.error_msg').html('').hide();
			}, 3000);
		},

		adjustDays: function(days) {
			var newDays = [];
			for (var i = 0; i < days.length; i++) {
				newDays[i] = days[(i + this.start_of_week) % 7];
			}
			return newDays;
		},

		strpad: function(num) {
			return (num < 10) ? '0' + num : num;
		}
	};

	$.extend($.fn, {
		datePicker: function(opts) {
			return this.each(function() {
				new datePicker(this, opts);
			});
		}
	});

})(Pika, 'getDate', 'getMonth', 'getFullYear'); 
