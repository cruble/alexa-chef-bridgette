var curr = new Date; // get current date
var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
var last = first + 6; // last day is the first day + 6

var firstday = new Date(curr.setDate(first)).toUTCString();
var lastday = new Date(curr.setDate(last)).toUTCString();

firstday
"Sun, 06 Mar 2011 12:25:40 GMT"
lastday
"Sat, 12 Mar 2011 12:25:40 GMT"