// read rle plainttext
function read(lifegamestring) {
    if (lifegamestring == null || lifegamestring.length == 0) return null;
    var lines = lifegamestring.split("\n");
    if (lines[0].substr(0, 1) == "!") {
        return readplaintext(lifegamestring);
    } else if (lines[0].substr(0, 1) == "#") {
        if (lines[0].substr(0, 10) == "#Life 1.05") {
            return null;
        } else if (lines[0].substr(0, 10) == "#Life 1.06") {
            return null;
        } else {
            return readrle(lifegamestring);
        }
    } else {
        return readrle(lifegamestring);
    }
}

function readplaintext(plainstring) {
    var plainlines = plainstring.split("\n");
    var datastart = false;
    var dataline = 0;
    var data = new Array();
    for (var i = 0; i < plainlines.length; i++) {
        if (datastart) {
            data[i - dataline] = new Array();
            for (var j = 0; j < plainlines[i].length; j++) {
                if (plainlines[i][j] == "O") data[i - dataline][j] = true; else if (plainlines[i][j] == ".") data[i - dataline][j] = false;
            }
        } else if (plainlines[i].indexOf("!") != 0) {
            datastart = true;
            dataline = i;
            i--;
        }
    }
    return data;
}

function readrle(rlestring) {
    var patternrowcount, patterncolcount;
    var rledata = "";
    var dataline = 0;
    var rlelines = rlestring.split("\n");
    if (rlelines.length < 2) return null;
    for (var i = 0; i < rlelines.length; i++) {
        if (rlelines[i].indexOf("#") != 0) {
            var line = rlelines[i].replace(/\s/g, "");
            if (dataline != 0 && i >= dataline) {
                rledata += line;
            } else if (line.indexOf("x=") != -1 && line.indexOf("y=") != -1) {
                dataline = i + 1;
                var defn = line.split(",");
                for (var j = 0; j < defn.length; j++) {
                    if (defn[j].indexOf("x=") == 0) patterncolcount = parseInt(defn[j].substring(2)); else if (defn[j].indexOf("y=") == 0) patternrowcount = parseInt(defn[j].substring(2));
                }
            }
        }
    }
    var data = new Array();
    var c = 0;
    var ns = "";
    var row = 0, col = 0;
    data[row] = new Array();
    while (c < rledata.length) {
        var r = rledata[c];
        if (r >= "0" && r <= "9") {
            ns += r;
        } else {
            var num = parseInt(ns);
            if (isNaN(num)) num = 1;
            if (r == "b") {
                for (var i = 0; i < num; i++) {
                    data[row][col] = false;
                    col++;
                }
            } else if (r == "o") {
                for (var i = 0; i < num; i++) {
                    data[row][col] = true;
                    col++;
                }
            } else if (r == "$") {
                var lefttcol = patterncolcount - col;
                for (var i = 0; i < lefttcol; i++) {
                    data[row][col] = false;
                    col++;
                }
                row++;
                data[row] = new Array();
                col = 0;
                for (var i = 0; i < num - 1; i++) {
                    for (var j = 0; j < patterncolcount; j++) {
                        data[row][j] = false;
                    }
                    row++;
                    data[row] = new Array();
                }
            } else if (r == "!") {
                var lefttcol = patterncolcount - col;
                for (var i = 0; i < lefttcol; i++) {
                    data[row][col] = false;
                    col++;
                }
                var leftrow = patternrowcount - row;
                for (var i = 0; i < leftrow; i++) {
                    row++;
                    data[row] = new Array();
                    for (var j = 0; j < patterncolcount; j++) {
                        data[row][j] = false;
                    }
                }
                break;
            }
            ns = "";
        }
        c++;
    }
    return data;
}

function generaterle(data) {
    var rowcount = data.length;
    var colcount = data[0].length;
    var emptytop = rowcount, emptybottom = rowcount, emptyleft = colcount, emptyright = colcount;
    for (var i = 0; i < rowcount; i++) {
        for (var j = 0; j < colcount; j++) {
            if (data[i][j]) {
                if (i < emptytop) emptytop = i;
                if (rowcount - i - 1 < emptybottom) emptybottom = rowcount - i - 1;
                if (j < emptyleft) emptyleft = j;
                if (colcount - j - 1 < emptyright) emptyright = colcount - j - 1;
            }
        }
    }
    if (colcount - emptyleft - emptyright <= 0 || rowcount - emptytop - emptybottom <= 0) return null;
    var rlepre = "#N Temp data by Javascript Robot\nx = " + (colcount - emptyleft - emptyright) + ",y = " + (rowcount - emptytop - emptybottom) + ", rule = 23/3";
    var rledata = "";
    var rleline = "";
    var current = "";
    var repeat = 1;
    for (var i = emptytop; i < rowcount - emptybottom; i++) {
        for (var j = emptyleft; j < colcount - emptyright; j++) {
            if (data[i][j]) {
                if (current == "") current = "o"; else if (current == "o") repeat++; else {
                    if (repeat == 1) rleline += current; else rleline += repeat + current;
                    repeat = 1;
                    current = "o";
                    if (rleline.length >= 70) {
                        rledata += "\n" + rleline;
                        rleline = "";
                    }
                }
            } else {
                if (current == "") current = "b"; else if (current == "b") repeat++; else {
                    if (repeat == 1) rleline += current; else rleline += repeat + current;
                    repeat = 1;
                    current = "b";
                }
            }
        }
        if (current == "o") {
            if (repeat == 1) rleline += current; else rleline += repeat + current;
        }
        repeat = 1;
        current = "";
        rleline += "$";
        if (rleline.length >= 70) {
            rledata += "\n" + rleline;
            rleline = "";
        }
    }
    if (rleline != "") rledata += "\n" + rleline;
    rledata += "!";
    var rlefinaldata = "";
    var c = 0;
    var dollarcount = 0;
    while (c < rledata.length) {
        if (rledata[c] == "$") {
            dollarcount++;
        } else {
            if (dollarcount == 1) {
                rlefinaldata += "$";
            } else if (dollarcount > 1) {
                rlefinaldata += dollarcount + "$";
            }
            dollarcount = 0;
            rlefinaldata += rledata[c];
        }
        c++;
    }
    return rlepre + rlefinaldata;
}