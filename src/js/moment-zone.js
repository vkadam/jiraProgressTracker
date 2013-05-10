/**
 * Convert moment date object into specified zone offset date object.
 * @param {integer} Zone offset in UTC in hours like +5.5 for Mumbai, -5 For Detroit
 * NOTE: This doesn't support day light saving yet.
 * Need to use moment-timezone when its production ready
 */
moment.fn.toZone = function(zoneOffsetHrs) {
    var localDateObj = this.clone();
    localDateObj.add(localDateObj.zone() * 60000);
    var zM = moment(localDateObj.valueOf() + (3600000 * zoneOffsetHrs));
    // console.log("The local for zone" + offset + " is " + zM.format("dddd, MMMM Do YYYY, h:mm:ss a"));
    // return value is the time in specified zoneOffsetHrs
    return zM;
};
