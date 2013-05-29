/*global window, document, $, Raphael */

(function () {
    "use strict";
    
    function setVariableInterval(callbackFunc, timing) {
        var variableInterval = {
            interval: timing,
            callback: callbackFunc,
            stopped: false,
            runLoop: function () {
                var result;
                
                if (variableInterval.stopped) {
                    return;
                }
            
                result = variableInterval.callback.call(variableInterval);
                
                if (typeof result === "number") {
                    
                    if (result === 0) {
                        return;
                    }
                    variableInterval.interval = result;
                }
                
                variableInterval.loop();
            },
            stop: function () {
                this.stopped = true;
                window.clearTimeout(this.timeout);
            },
            start: function () {
                this.stopped = false;
                return this.loop();
            },
            loop: function () {
                this.timeout = window.setTimeout(this.runLoop, this.interval);
                return this;
            }
        };

        return variableInterval.start();
    }
    
    
    function drawSector(paper, cx, cy, r, startAngle, endAngle, params) {
        var rad =  Math.PI / 180,
            x1 = cx + r * Math.cos(-startAngle * rad),
            x2 = cx + r * Math.cos(-endAngle * rad),
            y1 = cy + r * Math.sin(-startAngle * rad),
            y2 = cy + r * Math.sin(-endAngle * rad);
        
        return paper.path(["M", cx, cy, "L", x1, y1, "A", r, r, 0, 
                           +(endAngle - startAngle > 180), 0, 
                           x2, y2, "z"]).attr(params);
    }
    
    
    function expandYellow(paper, i, path, x, y, segments, color) {
        var j, increment = i;

        for (j = 0; j <= 10; j += 1, i += 1) {
            paper.path(path).attr({
                stroke: 'none',
                fill: 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')'
            }).rotate(-(363 / segments * i), x, y);
        }

        return i - 1;
    }
    
    
    function wheel(paper, x, y, r, colors) {
        var pi = Math.PI,
            nbColors = colors.length,
            endColor,
            color,
            color1,
            color2,
            yellowColorStart,
            yellowColorDelay,
            segments,
            path,
            a,
            i,
            j,
            n,
            d;
        
        // Formatting every color to its RGB values
        for (i = 0; i < nbColors; i += 1) {
            colors[i] = Raphael.getRGB(colors[i]);
        }

        // Initialize segments    
        segments = pi * r * 2 / Math.min(r / 8, 2);
        a = pi / 2 - pi * 2 / segments * 1.5;
        path = ["M", x, y - r, "A", r, r, 0, 0, 1, r * Math.cos(a) + x, y - 
                    r * Math.sin(a), "L", x, y, "z"].join();

        // Calculating where yellow color needs to be expanded
        yellowColorStart = Math.round(segments - segments * 0.30);

        // Drawing big white circle as canvas for logo
        paper.circle(x, y, r * 1.35).attr({
            stroke: "#e5e5e5",
            "stroke-width": 2,
            fill: "#fff"
        });

        // Drawing segments
        for (i = 0; i < segments; i += 1) {
            if (yellowColorDelay) {
                yellowColorDelay += 1;
            }

            // Between which 2 colors is this segment?
            j = nbColors * (yellowColorDelay || i) / segments;
            n = Math.floor(j);
            d = j % 1;
            color1 = colors[n];
            color2 = colors[(n + 1) % nbColors];
            // Calculate the segment's color from the 2 other
            color = {
                r: Math.round(d * (color2.r - color1.r) + color1.r),
                g: Math.round(d * (color2.g - color1.g) + color1.g),
                b: Math.round(d * (color2.b - color1.b) + color1.b)
            };

            if (i === Math.round(segments) - 2) {
                endColor = color;
            }

            color = endColor || color;

            if (i === yellowColorStart) {
                yellowColorDelay = i;
                i = expandYellow(paper, i, path, x, y, segments, color);
            
            } else {
                if (i === Math.round(segments) - 1) {
                    drawSector(paper, x, y - r + (r * 1.2 - r) / 2, (r - r * 0.8) / 2, 90, -90, {
                        stroke: "none",
                        fill: "rgb(" + color.r + "," + color.g + "," + color.b + ")"
                    });
                    
                    break;
                }
                
                // Drawing the sector
                paper.path(path).attr({
                    stroke: "none",
                    fill: "rgb(" + color.r + ',' + color.g + "," + color.b + ")"
                }).rotate(-(363 / segments) * i, x, y);
    
                
            }
        }

        // Drwaing inside white circle
        paper.circle(x, y, r * 0.8).attr({
            stroke : "none",
            fill: "#fff"
        });
    }
    
    
    function render(colors) {
        var paper = new Raphael("logo", 300, 300),
            segments,
            segmentsLength,
            interval,
            itterator = 0,
            startingOpacity = 0.05;
            

        wheel(paper, 149, 149, 100, [
                                     colors[0],
                                     colors[1],
                                     colors[2], colors[2],
                                     colors[3], colors[3], colors[3],
                                     colors[4], colors[4],
                                     colors[5], colors[5],
                                     colors[6], colors[6]
                                    ]);

        segments = $("svg path");
        segmentsLength = segments.length;
        
        segments.css({ opacity: 0 });
        
        interval = setVariableInterval(function () {
            var newOpacity = startingOpacity * itterator;
            
            $(segments.get(itterator)).css({
                opacity: newOpacity < 1 ? newOpacity : 1
            });
            
            if (itterator > segmentsLength / 2) {
                this.interval += 0.3;
            }
        
            if (itterator === segmentsLength) {
                this.stop();
                segments.css({opacity: ""});
            }
            itterator += 1;
        }, 3);
    }
    
    
    function rerender(colors) {
        $("#logo").html("");
        
        render(colors);
    }
    
    
    function colorPicker() {
        var el = $("#colorpicker"),
            wrpr = el.find("div"),
            slctd = $("#selected"),
            defaults = ["#ffffff", "#f8f6ff", "#ded8ff", "#8affed", "#50e971", "#fbfe01", "#ffba03"],
            pickers, length, i, changable;
            
        pickers = [
            "#F0D0C9", "#E2A293", "#D4735E", "#65281A",
            "#EDDFDA", "#DCC0B6", "#CBA092", "#7B4B3A",
            "#FCECD5", "#F9D9AB", "#F6C781", "#C87D0E",
            "#E1DCA5", "#D0C974", "#A29A36", "#514D1B",
            "#C6D9F0", "#8DB3E2", "#548DD4", "#17365D"
        ];
            
        render(defaults);
        
        for (i = 0, length = pickers.length; i < length; i += 1) {
            wrpr.append($("<span />").css({ "background-color": pickers[i] }));
        }
        
        for (i = 0, length = defaults.length; i < length; i += 1) {
            slctd.find("div").append($("<span />").css({ "background-color": defaults[i] }));
        }
        
        el.find("i").on("click", function () {
            el.fadeOut(250);
        }).parent().next("div").children("span").on("click", function () {
            var colors = [];
            
            slctd.find("div span:eq(" + changable + ")").css({
                "background-color": $(this).css("background-color")
            });
            
            el.fadeOut(250);
            
            slctd.find("div span").each(function () {
                colors.push($(this).css("background-color"));
            });
            
            rerender(colors);
        });
        
        slctd.find("div span").on("click", function () {
            changable = slctd.find("div span").index(this);
            el.fadeIn(250);
        });
    }
    
    
    $(document).ready(function () {
        setTimeout(function(){
            window.scrollTo(0, 1);
            colorPicker();
        }, 0);
    });
}());