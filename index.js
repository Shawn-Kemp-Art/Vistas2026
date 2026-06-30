
document.body.innerHTML = '<style>div{color: grey;text-align:center;position:absolute;margin:auto;top:0;right:0;bottom:0;left:0;width:500px;height:100px;}</style><body><div id="loading"><p>This could take a while, please give it at least 5 minutes to render.</p><br><h1 class="spin">⏳</h1><br><h3>Press <strong>?</strong> for shortcut keys</h3><br><p><small>Output contains an embedded blueprint for creating an IRL wall sculpture</small></p></div></body>';
paper.install(window);
window.onload = function() {

document.body.innerHTML = '<style>body {margin: 0px;text-align: center;}</style><canvas resize="true" style="display:block;width:100%;" id="myCanvas"></canvas>';

setquery("fxhash",$fx.hash);
var initialTime = new Date().getTime();

//file name 
var fileName = $fx.hash;

var canvas = document.getElementById("myCanvas");

paper.setup('myCanvas');
paper.activate();

//console.log(tokenData.hash)
console.log('#'+$fx.iteration)

canvas.style.background = "white";

//Set a seed value for Perlin
var seed = Math.floor($fx.rand()*10000000000000000);

//initialize perlin noise 
var noise = new perlinNoise3d();
noise.noiseSeed(seed);

//read in query strings
var qcolor1 = "AllColors";
if(new URLSearchParams(window.location.search).get('c1')){qcolor1 = new URLSearchParams(window.location.search).get('c1')}; //colors1
var qcolor2 = "None";
if(new URLSearchParams(window.location.search).get('c2')){qcolor2 = new URLSearchParams(window.location.search).get('c2')}; //colors2
var qcolor3 = "None";
if(new URLSearchParams(window.location.search).get('c3')){qcolor3 = new URLSearchParams(window.location.search).get('c3')}; //colors3
var qcolors = R.random_int(1,6);
if(new URLSearchParams(window.location.search).get('c')){qcolors = new URLSearchParams(window.location.search).get('c')}; //number of colors
var qsize = "2";
if(new URLSearchParams(window.location.search).get('s')){qsize = new URLSearchParams(window.location.search).get('s')}; //size
var qcomplexity = R.random_int(1,10);
if(new URLSearchParams(window.location.search).get('d')){qcomplexity = new URLSearchParams(window.location.search).get('d')}; //size

var qorientation =R.random_int(1,2) < 2 ? "portrait" : "landscape";
var qframecolor = R.random_int(0,3) < 1 ? "White" : R.random_int(1,3) < 2 ? "Mocha" : "Random";

//FXparams

definitions = [
    {
        id: "layers",
        name: "Layers",
        type: "number",
        default: 24,
        options: {
            min: 6,
            max: 24,
            step: 1,
        },  
    },
    {
        id: "orientation",
        name: "Orientation",
        type: "select",
        default: qorientation,    
        options: {options: ["portrait", "landscape"]},
    },
    {
        id: "aspectratio",
        name: "Aspect ratio",
        type: "select",
        default: "4:5",
        options: {options: ["1:1", "2:5","3:5","4:5","54:86","296:420"]},
    },
    {
        id: "size",
        name: "Size",
        type: "select",
        default: qsize,
        options: {options: ["1", "2", "3"]},
    },
    {
        id: "framecolor",
        name: "Frame color",
        type: "select",
        default: qframecolor,
        options: {options: ["White","Mocha"]},
    }, 
    {
        id: "matwidth",
        name: "Mat size",
        type: "number",
        default: 75,
        options: {
            min: 50,
            max: 200,
            step: 10,
        },  
    },
   
    ]


$fx.params(definitions)
var scale = $fx.getParam('size');
var stacks = $fx.getParam('layers');
var numofcolors = $fx.getParam('colors');


//Set the properties for the artwork where 100 = 1 inch
var wide = 800; 
var high = 1000; 

if ($fx.getParam('aspectratio')== "1:1"){wide = 800; high = 800};
if ($fx.getParam('aspectratio')== "2:5"){wide = 400; high = 1000};
if ($fx.getParam('aspectratio')== "3:5"){wide = 600; high = 1000};
if ($fx.getParam('aspectratio')== "4:5"){wide = 800; high = 1000};
if ($fx.getParam('aspectratio')== "54:86"){wide = 540; high = 860};
if ($fx.getParam('aspectratio')== "296:420"){wide =705; high = 1000};


var ratio = 1/scale;//use 1/4 for 32x40 - 1/3 for 24x30 - 1/2 for 16x20 - 1/1 for 8x10
var minOffset = ~~(7*ratio); //this is aproximatly .125"
var framewidth = ~~($fx.getParam('matwidth')*ratio*scale); 
var framradius = 0;


// Set a canvas size for when layers are exploded where 100=1in
var panelWide = 1600; 
var panelHigh = 2000; 
 
paper.view.viewSize.width = 2400;
paper.view.viewSize.height = 2400;


var colors = []; var palette = []; 

if ($fx.getParam('framecolor')=="White"){colors[stacks-1]={"Hex":"#FFFFFF", "Name":"Smooth White"}};
if ($fx.getParam('framecolor')=="Mocha"){colors[stacks-1]={"Hex":"#4C4638", "Name":"Mocha"}};


var woodframe = new Path();var framegap = new Path();
var fColor = frameColors[R.random_int(0, frameColors.length-1)];
fColor = {"Hex":"#60513D","Name":"Walnut"};
var frameColor = fColor.Hex;

//adjust the canvas dimensions
w=wide;h=high;
var orientation="Portrait";
 
if ($fx.getParam('orientation')=="landscape"){wide = h;high = w;orientation="Landscape";};
if ($fx.getParam('orientation')=="portrait"){wide = w;high = h;orientation="Portrait";};

//Set the line color
linecolor={"Hex":"#4C4638", "Name":"Mocha"};


//************* Draw the layers ************* 


//vvvvvvvvvvvvvvv CLIPPER BOOLEAN ENGINE vvvvvvvvvvvvvvv
var CLIP_SCALE = 100;   // Integer precision for Clipper (100 = 0.01 unit resolution)
var CLIP_FLATTEN = 0.1; // Bezier-to-polygon tolerance (lower = smoother, more points)

function _toClipperPaths(paperItem) {
    var clone = paperItem.clone({ insert: false });
    clone.flatten(CLIP_FLATTEN);
    var children = (clone.className === 'CompoundPath') ? clone.children : [clone];
    var result = [];
    for (var i = 0; i < children.length; i++) {
        var segs = children[i].segments;
        if (segs.length < 3) continue;
        var pts = new Array(segs.length);
        for (var j = 0; j < segs.length; j++) {
            pts[j] = { X: Math.round(segs[j].point.x * CLIP_SCALE),
                       Y: Math.round(segs[j].point.y * CLIP_SCALE) };
        }
        result.push(pts);
    }
    clone.remove();
    return result;
}

function _fromClipperPaths(clipperPaths) {
    if (!clipperPaths || clipperPaths.length === 0) return new Path();
    var compound = new CompoundPath({});
    for (var i = 0; i < clipperPaths.length; i++) {
        var pts = clipperPaths[i];
        if (pts.length < 3) continue;
        var paperPts = new Array(pts.length);
        for (var j = 0; j < pts.length; j++) {
            paperPts[j] = new Point(pts[j].X / CLIP_SCALE, pts[j].Y / CLIP_SCALE);
        }
        compound.addChild(new Path({ segments: paperPts, closed: true, insert: false }));
    }
    // Use non-zero winding — matches Paper.js canvas default and Clipper's output orientation.
    // CleanPolygons removes near-degenerate edges that can cause winding flips at fine tolerances.
    ClipperLib.Clipper.CleanPolygons(clipperPaths, 0.5);
    compound.reorient(true, true);
    return compound;
}

function _clipBool(a, b, clipType) {
    var savedStyle = a.style;
    var clipper = new ClipperLib.Clipper();
    clipper.AddPaths(_toClipperPaths(a), ClipperLib.PolyType.ptSubject, true);
    clipper.AddPaths(_toClipperPaths(b), ClipperLib.PolyType.ptClip, true);
    var solution = new ClipperLib.Paths();
    clipper.Execute(clipType, solution,
        ClipperLib.PolyFillType.pftNonZero,
        ClipperLib.PolyFillType.pftNonZero);
    var result = _fromClipperPaths(solution);
    result.style = savedStyle;
    return result;
}

function clipUnite(a, b)     { return _clipBool(a, b, ClipperLib.ClipType.ctUnion); }
function clipSubtract(a, b)  { return _clipBool(a, b, ClipperLib.ClipType.ctDifference); }
function clipIntersect(a, b) { return _clipBool(a, b, ClipperLib.ClipType.ctIntersection); }
//^^^^^^^^^^^^^ END CLIPPER BOOLEAN ENGINE ^^^^^^^^^^^^^

sheet = []; //This will hold each layer

//project setup
var orbCenter = new Point(Math.floor(framewidth*2+R.random_dec()*(wide-framewidth*4)),Math.floor(framewidth*2+R.random_dec()*(high/2-framewidth*4)))
var orbSize = Math.floor(R.random_dec()*wide/4+50)
var horizonLine = Math.floor(high/3+(high/3)*R.random_dec());

var layerLines = [];
for (l=0;l<stacks+1;l++){
    layerLines[l]=Math.floor(horizonLine+((high-horizonLine)/(stacks+1)*l));
}



if (R.random_dec()<.5){
    var time='Day';
    colors[1]={"Hex":"#035680","Name":"Blue"}
    colors[0]= sunColors[Math.floor(R.random_dec()*sunColors.length)];

    }else {
        var time='Night';
        colors[1]={"Hex":"#301736","Name":"Purple"}
        colors[0]=moonColors[Math.floor(R.random_dec()*moonColors.length)];
    }
    console.log(time);


var hasTrees=Math.floor(R.random_dec()*3);
var hasObolisks=Math.floor(R.random_dec()*3);
var hasRays=Math.floor(R.random_dec()*2.25);
var hasStars=Math.floor(R.random_dec()*2.25);
var hasClouds=Math.floor(R.random_dec()*5.25);
var hasBoats=Math.floor(R.random_dec()*2.25);
var hasRocks=Math.floor(R.random_dec()*2.25);

//Build the layers for the scene
var scene = [];

scene = landscapeTypes[Math.floor(R.random_dec()*landscapeTypes.length)];

if (scene.id == 1) {
     //Mountain range
    sceneBack = [mountain]; 
    sceneMid = [mountain]
    sceneFront = [mountain]
} 
else if (scene.id == 2) {
    //beach
    sceneBack = [water]; 
    sceneMid = [water,sand]
    sceneFront = [sand]
} 

else if (scene.id == 3) {
    //mesa
    hasTrees=0
    sceneBack = [mountain]; 
    sceneMid = [plains,mountain]
    sceneFront = [plains,sand]
} 
else if (scene.id == 4) {
    //foothills
    sceneBack = [hills]; 
    sceneMid = [hills,fields]
    sceneFront = [fields]
} 
else if (scene.id == 5) {
    //open ocean
    sceneBack = [water]; 
    sceneMid = [water]
    sceneFront = [water]
} 
else if (scene.id == 6) {
    //River
    sceneBack = [hills,mountain]; 
    sceneMid = [water]
    sceneFront = [water,hills]
} 
else if (scene.id == 7) {
    //canyons
    hasBoats=0;hasTrees=0;
    sceneBack = [water,mountain]; 
    sceneMid = [water,mountain]
    sceneFront = [water,mountain,mountain]
} 
else{
    //random
    scene= landscapeTypes[0]
    sceneBack = [mountain,hills,plains,sand,fields]; 
    sceneMid = [mountain,hills,plains,sand,water,fields];
    sceneFront = [mountain,hills,plains,sand,water,fields];
}


for (s=0;s<stacks;s++){
scene[s] = sceneBack[Math.floor(R.random_dec()*sceneBack.length)];
}
for (s=stacks-11;s<stacks;s++){
scene[s] = sceneMid[Math.floor(noise.get(s/10)*sceneMid.length)];
}
for (s=stacks-6;s<stacks;s++){
scene[s] = sceneFront[Math.floor(noise.get(s/10)*sceneFront.length)];
}

if (time == 'Day'){scene[0]=sun}
if (time == 'Night'){scene[0]=moon}
if (hasClouds ==1){scene[2] = clouds;}

// add mountainTree layers between mountains 
for (s=2;s<stacks-1;s++){
    if (scene[s].name == "mountain" && scene[s-2].name == "mountain" && hasTrees == 1 && R.random_dec()<.50){
    scene[s-1]=mountainTrees;
    }
}

// add sandRocks layers between sand
for (s=2;s<stacks-1;s++){
    if (scene[s].name == "sand" && scene[s-2].name == "sand" && hasRocks == 1 && R.random_dec()<.25){
    scene[s-1]=sandRocks;
    }
}


// add plainObolisks layers between plains 
for (s=2;s<stacks-1;s++){
    if (scene[s].name == "plains" && scene[s-2].name == "plains" && hasObolisks == 1 && R.random_dec()<.25){
    scene[s-1]=plainObolisks;
    }
}

// add boat layers between water 
for (s=2;s<stacks-1;s++){
    if (scene[s].name == "water" && scene[s-2].name == "water" && hasBoats == 1 && R.random_dec()<.25){
    scene[s-1]=boats;
    }
}

console.log(scene.name);

var features = {};
var renderTime;

(async () => {

paper.view.autoUpdate = false;

// Warm-up: force paper.js to yield/render once before the first real Clipper
// boolean op, otherwise the very first clip*() silently returns empty and the
// bottom layer's frame comes out blank (artwork renders one layer short).
paper.view.update();
await new Promise(resolve => setTimeout(resolve, 0));

for (z = 0; z < stacks; z++) {
    px=0; py=0;pz=0;prange=1;
    
    pz=pz+prange;
    
    //First we build a frame
    var outsideframe = new Path.Rectangle(new Point(0, 0),new Size(wide, high), framradius)
    var insideframe = new Path.Rectangle(new Point(framewidth, framewidth),new Size(wide-framewidth*2, high-framewidth*2))
    sheet[z] = clipSubtract(outsideframe, insideframe);
    outsideframe.remove();insideframe.remove();

    
        if(z==0){solid(z)}
    
        if (z==1 && time == 'Day'){solid(z);sun(z);if(hasRays==1){rays(z)}}
        if (z==1 && time == 'Night'){solid(z);moon(z);if(hasStars==1){stars(z)}}
        if (z>1 && z<stacks-1){scene[z](z);}
       
        frameIt(z);// finish the layer with a final frame cleanup 

        cutMarks(z);
        hanger(z);// add cut marks and hanger holes
        if (z == stacks-1) {signature(z);}// sign the top layer
        sheet[z].scale(2.2);
        sheet[z].position = new Point(paper.view.viewSize.width/2, paper.view.viewSize.height/2);
       
        var group = new Group(sheet[z]);
        
        console.log(z)//Show layer completed in console
        paper.view.update();
        await new Promise(resolve => setTimeout(resolve, 0));

}//end z loop

//--------- Finish up the preview ----------------------- 

    // Build the features and trigger an fxhash preview
    features = {};
    features.Size = ~~(wide/100/ratio)+" x "+~~(high/100/ratio)+" inches";
    features.Width = ~~(wide/100/ratio);
    features.Height = ~~(high/100/ratio);
    features.Depth = stacks*0.0625;
    features.Layers = stacks;
    for (l=stacks;l>0;l--){
    var key = "layer: "+(stacks-l+1)
    features[key] = colors[l-1].Name
    }
    console.log(features);
    $fx.features(features);

 //Begin send to studio.shawnkemp.art **************************************************************
     studioAPI.setApiBase('https://studio-shawnkemp-art.vercel.app');
     if(new URLSearchParams(window.location.search).get('skart')){sendAllExports()};
//End send to studio.shawnkemp.art **************************************************************

      var finalTime = new Date().getTime();
    renderTime = (finalTime - initialTime)/1000
    console.log ('Render took : ' +  renderTime.toFixed(2) + ' seconds' );

    paper.view.autoUpdate = true;
    paper.view.update();

})();

async function sendAllExports() {

        paper.view.update();
        // Send canvas as PNG
        await studioAPI.sendCanvas(myCanvas, $fx.hash, $fx.hash+".png");

        // Send SVG
        await studioAPI.sendSVG(project.exportSVG({asString: true}), $fx.hash, $fx.hash+".svg");

        // send colors
        var content = JSON.stringify(features,null,2);

        // Send text/JSON
        await studioAPI.sendText(JSON.stringify(colors), $fx.hash, "Colors-"+$fx.hash+".json");

        // 2. Add frame
        floatingframe();
        paper.view.update();
        // 3. Framed PNGs (Black, White, Walnut, Maple)
        var frameOptions = [
            { name: "Black", hex: "#1f1f1f" },
            { name: "White", hex: "#f9f9f9" },
            { name: "Walnut", hex: "#60513D" },
            { name: "Maple", hex: "#ebd9c0" }
        ];
        for (var i = 0; i < frameOptions.length; i++) {
            woodframe.style = { fillColor: frameOptions[i].hex };
            var fileName = "Framed" + frameOptions[i].name + "-" + $fx.hash;
            paper.view.update();

            await studioAPI.sendCanvas(myCanvas,  $fx.hash, fileName+".png");
        }
        // 4. Remove frame
        floatingframe();
        // 5. Blueprint SVG
        for (var z = 0; z < stacks; z++) {
            sheet[z].style = {
                fillColor: null,
                strokeWidth: 0.1,
                strokeColor: lightburn[stacks - z - 1].Hex,
                shadowColor: null,
                shadowBlur: null,
                shadowOffset: null
            };
            sheet[z].selected = true;
        }
        paper.view.update();

        // Send SVG
        await studioAPI.sendSVG(project.exportSVG({asString: true}), $fx.hash, "Blueprint-" + $fx.hash+".svg");
        // 6. Plotting SVG
        for (var z = 0; z < stacks; z++) {
            sheet[z].style = {
                fillColor: null,
                strokeWidth: 0.1,
                strokeColor: plottingColors[stacks - z - 1].Hex,
                shadowColor: null,
                shadowBlur: null,
                shadowOffset: null
            };
            sheet[z].selected = true;
        }
        for (var z = 0; z < stacks; z++) {
            if (z < stacks - 1) {
                for (var zs = z + 1; zs < stacks; zs++) {
                    var _old = sheet[z];
                    sheet[z] = clipSubtract(_old, sheet[zs]);
                    _old.remove();
                }
            }
        }
        paper.view.update();
        // Send SVG
        await studioAPI.sendSVG(project.exportSVG({asString: true}), $fx.hash, "Plotting-" + $fx.hash+".svg");

        // Send features
        await studioAPI.sendFeatures($fx.hash, features);

        console.log("All exports sent!");
        studioAPI.signalComplete();
    }

async function refreshit() {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 3 sec
        canvas.toBlob(function(blob) {saveAs(blob, tokenData.hash+' - '+renderTime.toFixed(0)+'secs.png');});
        await new Promise(resolve => setTimeout(resolve, 5000)); // 3 sec
        window.open('./index.html?testing=true', '_blank');
        }

//vvvvvvvvvvvvvvv PROJECT FUNCTIONS vvvvvvvvvvvvvvv 
 
function sun(z) {
    var sun = new Path.Circle(orbCenter, orbSize);
    var _old = sheet[z];
    sheet[z] = clipSubtract(_old, sun);
    sun.remove();
    _old.remove();
 }

 function moon(z) {
    var moonfull = new Path.Circle(orbCenter, orbSize);
    var cut = new Path.Circle(orbCenter+[R.random_dec()*(orbSize/2)+framewidth,0], orbSize);
    orb = clipSubtract(moonfull, cut);
    cut.remove();moonfull.remove();
    orb.rotate(R.random_dec()*90);
    var _old = sheet[z];
    sheet[z] = clipSubtract(_old, orb);
    orb.remove();
    _old.remove();
 }


function stars(z){
    for (s=0;s<R.random_dec()*65;s++){
        center = new Point(R.random_dec()*wide, R.random_dec()*high);
        var star = new Path.Star(center, 6, 8, 16);
        star.rotate(R.random_dec()*90);
        var _old = sheet[z];
        sheet[z] = clipSubtract(_old, star);
        star.remove();
        _old.remove();
    }

}

 function rays(z,zTo) {
    if (zTo == null){zTo = z;}
    sunradius = orbSize+20;
    //c=new Point(wide/2,high/2);
    rs = orbCenter + [orbSize+20,0];
    rayRad = 360/Math.floor((R.random_dec()*30+10))
    for (r=1;r<360;r=r+rayRad){
        //ray = new Path.Rectangle(rs,new Size(wide,10))
        var ray = new Path();
        ray.add(rs+[0,-2]);
        ray.add(rs+[noise.get(r)*wide,noise.get(r)*-30]);
        ray.add(rs+[noise.get(r)*wide,noise.get(r)*30]);
        ray.add(rs+[0,2]);
        ray.rotate(r,orbCenter);
        var _old = sheet[zTo];
        sheet[zTo] = clipSubtract(_old, ray);
        ray.remove();
        _old.remove();
        frameIt(z);
    }
    
 }


function clouds(z) {
    for (c=0;c<wide;c=c+40){
    var cloudCenter = new Point(c,Math.floor(R.random_dec()*100))
    var cloudSize = Math.floor(25+R.random_dec()*100)
    var cloud = new Path.Circle(cloudCenter, cloudSize);
    var _old = sheet[z];
    sheet[z] = clipUnite(_old, cloud);
    cloud.remove();
    _old.remove();
    colors[z]= cloudColors[Math.floor(R.random_dec()*cloudColors.length)];
 }
 }


 function water(z,zTo) {
    if (zTo == null){zTo = z;}
    start = layerLines[z];
    range = layerLines[z]-layerLines[z-1];
    lo = layerLines[z]-range/4;
    hi = layerLines[z]+range/4;
    wavelength = Math.floor(10+noise.get(z)*wide/5)
    waves = 0;
     //console.log(hi,start,lo,range)
     var mpoint = new Point(0,start)
     var path = new Path();
        path.add(mpoint);
        for (c=25;c<wide-25;c=c+wavelength){
            if (noise.get(c,z)<.40){
                mpoint = new Point(c,lo)
            }else if(noise.get(c,z)>.60){
                mpoint = new Point(c,hi)
            } else {
                mpoint = new Point(c,start)
            }
            waves = waves+1; if (waves>1){waves=0}
            if (waves == 1){mpoint = new Point(c,lo)}
                if (waves == 0){mpoint = new Point(c,hi)}
            path.add(mpoint);        
        }
        mpoint = new Point(wide,start)
        path.add(mpoint);
        path.smooth();
        mpoint = new Point(wide,high)
        path.add(mpoint);
        mpoint = new Point(0,high)
        path.add(mpoint);
        mpoint = new Point(0,start)
        path.add(mpoint);    
    var _old = sheet[zTo];
    sheet[zTo] = clipUnite(_old, path);
    path.remove();
    _old.remove();
    colors[z]= waterColors[Math.floor(noise.get(z)*waterColors.length)];
 
 }

 function plains(z,zTo) {
    if (zTo == null){zTo = z;}
    start = layerLines[z];
    range = layerLines[z]-layerLines[z-1];
    lo = layerLines[z]-range/10;
    hi = layerLines[z]+range/10;
     //console.log(hi,start,lo,range)
     var mpoint = new Point(0,start)
     var path = new Path();
        path.add(mpoint);
        for (c=25;c<wide-25;c=c+noise.get(z)*wide/25){
            if (noise.get(c,z)<.40){
                mpoint = new Point(c,lo)
            }else if(noise.get(c,z)>.60){
                mpoint = new Point(c,hi)
            } else {
                mpoint = new Point(c,start)
            }         
            path.add(mpoint);          
        }
        mpoint = new Point(wide,start)
        path.add(mpoint);
        mpoint = new Point(wide,high)
        path.add(mpoint);
        mpoint = new Point(0,high)
        path.add(mpoint);
        mpoint = new Point(0,start)
        path.add(mpoint);             
    var _old = sheet[zTo];
    sheet[zTo] = clipUnite(_old, path);
    path.remove();
    _old.remove();
    colors[z]= plainColors[Math.floor(noise.get(z)*plainColors.length)];
 }


function fields(z,zTo) {
    if (zTo == null){zTo = z;}
    start = layerLines[z];
    range = layerLines[z]-layerLines[z-1];
    lo = layerLines[z]-range/20;
    hi = layerLines[z]+range/20;
     //console.log(hi,start,lo,range)
     var mpoint = new Point(0,start)
     var path = new Path();
        path.add(mpoint);
        for (c=25;c<wide-25;c=c+noise.get(z)*wide/25){
            if (noise.get(c,z)<.50){
                mpoint = new Point(c,lo)
            } else {
                mpoint = new Point(c,hi)
            }     
            path.add(mpoint);          
        }
        mpoint = new Point(wide,start)
        path.add(mpoint);
        path.smooth();
        mpoint = new Point(wide,high)
        path.add(mpoint);
        mpoint = new Point(0,high)
        path.add(mpoint);
        mpoint = new Point(0,start)
        path.add(mpoint);      
    var _old = sheet[zTo];
    sheet[zTo] = clipUnite(_old, path);
    path.remove();
    _old.remove();
    colors[z]= fieldColors[Math.floor(noise.get(z)*fieldColors.length)];
 }


 function sand(z,zTo) {
    if (zTo == null){zTo = z;}
    start = layerLines[z];
    range = layerLines[z]-layerLines[z-1];
    lo = layerLines[z]-range/30;
    hi = layerLines[z]+range/30;
     //console.log(hi,start,lo,range)
     var mpoint = new Point(0,start)
     var path = new Path();
        path.add(mpoint);
        for (c=25;c<wide-25;c=c+noise.get(z)*wide/25){
            if (noise.get(c,z)<.40){
                mpoint = new Point(c,lo)
            }else if(noise.get(c,z)>.60){
                mpoint = new Point(c,hi)
            } else {
                mpoint = new Point(c,start)
            }
         
            path.add(mpoint);     
        }
        mpoint = new Point(wide,start)
        path.add(mpoint);
        path.smooth();
        mpoint = new Point(wide,high)
        path.add(mpoint);
        mpoint = new Point(0,high)
        path.add(mpoint);
        mpoint = new Point(0,start)
        path.add(mpoint);     
    var _old = sheet[zTo];
    sheet[zTo] = clipUnite(_old, path);
    path.remove();
    _old.remove();
    colors[z]= beachColors[Math.floor(noise.get(z)*beachColors.length)];
 }



function hills(z,zTo) {
    if (zTo == null){zTo = z;}
    start = layerLines[z];
    range = layerLines[z]-layerLines[z-1];
    lo = layerLines[z]-range*2;
    hi = layerLines[z]+range*2;
     //console.log(hi,start,lo,range)
     var mpoint = new Point(0,start)
     var path = new Path();
        path.add(mpoint);
        for (c=25;c<wide-25;c=c+noise.get(z)*wide){
            if (noise.get(c,z)<.5){
                mpoint = new Point(c,lo)
            }else if(noise.get(c,z)>.5){
                mpoint = new Point(c,hi)
            } else {
                mpoint = new Point(c,start)
            }
         
            path.add(mpoint);     
        }
        mpoint = new Point(wide,start)
        path.add(mpoint);
        path.smooth();

        mpoint = new Point(wide,high)
        path.add(mpoint);
        mpoint = new Point(0,high)
        path.add(mpoint);
        mpoint = new Point(0,start)
        path.add(mpoint);  
    var _old = sheet[zTo];
    sheet[zTo] = clipUnite(_old, path);
    path.remove();
    _old.remove();
    colors[z]= hillColors[Math.floor(noise.get(z)*hillColors.length)];
 }


  function mountain(z,zTo) {
    if (zTo == null){zTo = z;}
     start = layerLines[z];
     range = layerLines[z]-layerLines[z-1];
    lo = layerLines[z]-range*4;
    hi = layerLines[z]+range*4;
    var mpoint = new Point(0, start)
     var path = new Path();
        path.add(mpoint);
        for (c=25;c<wide-25;c=c+noise.get(z)*wide){
            if (noise.get(c,z)<.40){
                mpoint = new Point(c,lo)
            }else if(noise.get(c,z)>.60){
                mpoint = new Point(c,hi)
            } else {
                mpoint = new Point(c,start)
            }   
            path.add(mpoint);   
        }
        mpoint = new Point(wide, start)
        path.add(mpoint);
        mpoint = new Point(wide,high)
        path.add(mpoint);
        mpoint = new Point(0,high)
        path.add(mpoint);
    var _old = sheet[zTo];
    sheet[zTo] = clipUnite(_old, path);
    path.remove();
    _old.remove();
    colors[z]= mountainColors[Math.floor(R.random_dec()*mountainColors.length)];
 }

 function mountainTrees(z){
    mountain(z+1,z);
    start = layerLines[z+1];
     range = layerLines[z+1]-layerLines[z];
    lo = layerLines[z+1]-range*4;
    hi = layerLines[z+1]+range*4;
    for (t=R.random_dec()*100;t<wide-50;t=t+R.random_dec()*100+(40*z)){
        var center = new Point(t, hi);
        var sides = 3;
        var radius = 5*z+50;
        var tree = new Path.RegularPolygon(center, sides, radius);
        //tree.scale(R.random_dec()*.8+.25, R.random_dec()+.5)
        tree.scale(1, R.random_dec()*2+5)
        var _old = sheet[z];
        sheet[z] = clipUnite(_old, tree);
        tree.remove();
        _old.remove();
    }
    colors[z]= treeColors[Math.floor(R.random_dec()*treeColors.length)];

 }

 function sandRocks(z){
    sand(z+1,z);
    start = layerLines[z+1];
     range = layerLines[z+1]-layerLines[z];
    lo = layerLines[z+1]-range*4;
    hi = layerLines[z+1]+range*4;
    for (t=R.random_dec()*300;t<wide-50;t=t+R.random_dec()*100+(40*z)){
        var sides = 7
        var center = new Point(t, start);
        var radius = R.random_dec()*10*z+10;
        var rock = new Path.RegularPolygon(center, sides, radius);
        //tree.scale(R.random_dec()*.8+.25, R.random_dec()+.5)
        //tree.scale(1, R.random_dec()*2+5)
        var _old = sheet[z];
        sheet[z] = clipUnite(_old, rock);
        rock.remove();
        _old.remove();
    }
     colors[z]= rockColors[Math.floor(R.random_dec()*rockColors.length)];
 }


 function plainObolisks(z){
    plains(z+1,z);
    start = layerLines[z+1];
     range = layerLines[z+1]-layerLines[z];
    lo = layerLines[z+1]-range*4;
    hi = layerLines[z+1]+range*4;
    for (t=R.random_dec()*wide;t<wide-50;t=t+R.random_dec()*wide+(40*z)){
        var center = new Point(t, hi);
        var sides = 4;
        var radius = 5*z+50;
        var tree = new Path.RegularPolygon(center, sides, radius);
        //tree.scale(R.random_dec()*.8+.25, R.random_dec()+.5)
        tree.scale(.5, R.random_dec()*2+5)
        var _old = sheet[z];
        sheet[z] = clipUnite(_old, tree);
        tree.remove();
        _old.remove();
    }
    colors[z]= oboliskColors[Math.floor(R.random_dec()*oboliskColors.length)];

 }


 function boats(z){
    water(z+1,z);
    var radius = Math.floor(15+noise.get(z)*10*z);
    xpos = Math.floor(radius*2+R.random_dec()*(wide-radius*2))
    var center = new Point(xpos, layerLines[z+1]); 
    var boat = new Path.Circle(center,radius);
    var path = new Path.Rectangle(new Point(xpos-radius,layerLines[z+1]-radius*2),radius*2 )
    var _oldBoat = boat;
    boat = clipSubtract(_oldBoat, path);
    path.remove();
    _oldBoat.remove();
    path = new Path.Rectangle(center,new Size(20, radius))
    path.position.y += -radius*.75
    path.position.x += -10
    var _oldBoat2 = boat;
    boat = clipUnite(_oldBoat2, path);
    path.remove();
    _oldBoat2.remove();
    var sides = 3;
    //var radius = 5*z+50;
    var path = new Path.RegularPolygon(center, sides, radius);
    path.position.y +=-radius*.80
    var _oldBoat3 = boat;
    boat = clipUnite(_oldBoat3, path);
    path.remove();
    _oldBoat3.remove();
    boat.position.y += -radius/3
    boat.rotate(15-Math.floor(R.random_dec()*30))
    var _old = sheet[z];
    sheet[z] = clipUnite(_old, boat);
    boat.remove();
    _old.remove();
    colors[z]={"Hex":"#292831","Name":"Black"}
 }



//^^^^^^^^^^^^^ END PROJECT FUNCTIONS ^^^^^^^^^^^^^ 




//--------- Helper functions ----------------------- 
function floatingframe(){
    var frameWide=~~(34*ratio);var frameReveal = ~~(12*ratio);
  if (framegap.isEmpty()){
        var outsideframe = new Path.Rectangle(new Point(0, 0),new Size(~~(wide+frameReveal*2), ~~(high+frameReveal*2)), framradius)
        var insideframe = new Path.Rectangle(new Point(frameReveal, frameReveal),new Size(wide, high)) 
        framegap = clipSubtract(outsideframe, insideframe);
        outsideframe.remove();insideframe.remove();
        framegap.scale(2.2);
        framegap.position = new Point(paper.view.viewSize.width/2, paper.view.viewSize.height/2);
        framegap.style = {fillColor: '#1A1A1A', strokeColor: "#1A1A1A", strokeWidth: 1*ratio};
    } else {framegap.removeChildren()} 
    
    if (woodframe.isEmpty()){
        var outsideframe = new Path.Rectangle(new Point(0, 0),new Size(wide+frameWide*2+frameReveal*2, high+frameWide*2+frameReveal*2), framradius)
        var insideframe = new Path.Rectangle(new Point(frameWide, frameWide),new Size(wide+frameReveal*2, high+frameReveal*2)) 
        woodframe = clipSubtract(outsideframe, insideframe);
        outsideframe.remove();insideframe.remove();
        woodframe.scale(2.2);
        woodframe.position = new Point(paper.view.viewSize.width/2, paper.view.viewSize.height/2);
        var framegroup = new Group(woodframe);
        woodframe.style = {fillColor: frameColor, strokeColor: "#1A1A1A", strokeWidth: 2*ratio,shadowColor: new Color(0,0,0,[0.5]),shadowBlur: 20,shadowOffset: new Point(10*2.2, 10*2.2)};
    } else {woodframe.removeChildren()} 
    //fileName = "Framed-"+$fx.hash;
}


function rangeInt(range,x,y,z){
    var v = ~~(range-(noise.get(x,y,z)*range*2));
    return (v);
}

// Add shape s to sheet z
function join(z,s){
    var _old = sheet[z];
    sheet[z] = clipUnite(s, _old);
    s.remove();
    _old.remove();
}

// Subtract shape s from sheet z
function cut(z,s){
    var _old = sheet[z];
    sheet[z] = clipSubtract(_old, s);
    s.remove();
    _old.remove();
}

function drawFrame(z){
    var outsideframe = new Path.Rectangle(new Point(0, 0),new Size(wide, high), framradius)
    var insideframe = new Path.Rectangle(new Point(framewidth, framewidth),new Size(wide-framewidth*2, high-framewidth*2))
    sheet[z] = clipSubtract(outsideframe, insideframe);
    outsideframe.remove();insideframe.remove();
}


function solid(z){ 
    outsideframe = new Path.Rectangle(new Point(1,1),new Size(wide-1, high-1), framradius)
    //outsideframe = new Path.Circle(new Point(wide/2),wide/2)
    var _old = sheet[z];
    sheet[z] = clipUnite(_old, outsideframe);
    outsideframe.remove();
    _old.remove();
}



function frameIt(z){
        //Trim to size
        var outsideframe = new Path.Rectangle(new Point(0, 0),new Size(wide, high), framradius)
        //var outsideframe = new Path.Circle(new Point(wide/2, wide/2),wide/2);
        var _old = sheet[z];
        sheet[z] = clipIntersect(outsideframe, _old);
        outsideframe.remove();
        _old.remove();

        //Make sure there is still a solid frame
        var outsideframe = new Path.Rectangle(new Point(0, 0),new Size(wide, high), framradius)
        var insideframe = new Path.Rectangle(new Point(framewidth, framewidth),new Size(wide-framewidth*2, high-framewidth*2)) 

        var frame = clipSubtract(outsideframe, insideframe);
        outsideframe.remove();insideframe.remove();
        var _old2 = sheet[z];
        sheet[z] = clipUnite(_old2, frame);
        frame.remove();
        _old2.remove();
         
        sheet[z].style = {fillColor: colors[z].Hex, strokeColor: linecolor.Hex, strokeWidth: 1*ratio,shadowColor: new Color(0,0,0,[0.3]),shadowBlur: 20,shadowOffset: new Point((stacks-z)*2.3, (stacks-z)*2.3)};
}

function cutMarks(z){
    if (z<stacks-1 && z!=0) {
          for (etch=0;etch<stacks-z;etch++){
                var layerEtch = new Path.Circle(new Point(50+etch*10,25),2)
                cut(z,layerEtch)
            } 
        }
}

function signature(z){
    shawn = new CompoundPath(sig);
    shawn.strokeColor = 'green';
    shawn.fillColor = 'green';
    shawn.strokeWidth = 1;
    shawn.scale(ratio*.9)
    shawn.position = new Point(wide-framewidth-~~(shawn.bounds.width/2), high-framewidth+~~(shawn.bounds.height));
    cut(z,shawn)
}

function hanger (z){
    if (z < stacks-2 && scale>0){
        var r = 30*ratio;
        rt = 19*ratio;
        if (z<3){r = 19*ratio}
        layerEtch = new Path.Rectangle(new Point(framewidth/2, framewidth),new Size(r*2, r*3), r)
        layerEtch.position = new Point(framewidth/2,framewidth);   
        cut(z,layerEtch)

        layerEtch = new Path.Rectangle(new Point(wide-framewidth/2, framewidth),new Size(r*2, r*3), r)
        layerEtch.position = new Point(wide-framewidth/2,framewidth);   
        cut(z,layerEtch)

        layerEtch = new Path.Rectangle(new Point(wide/2, framewidth/2),new Size(r*4, r*2), r)
        layerEtch.position = new Point(wide/2,framewidth/2);   
        cut(z,layerEtch)
    }
}




//--------- Interaction functions -----------------------
var interactiontext = "Interactions\nB = Blueprint mode\nV = Export SVG\nP = Export PNG\nC = Export colors as TXT\nE = Show layers\nF = Add floating frame\nL = Format for plotting"

view.onDoubleClick = function(event) {
    alert(interactiontext);
    console.log(project.exportJSON());
    //canvas.toBlob(function(blob) {saveAs(blob, tokenData.hash+'.png');});
};

document.addEventListener('keypress', (event) => {

       //Save as SVG 
       if(event.key == "v") {
            var url = "data:image/svg+xml;utf8," + encodeURIComponent(paper.project.exportSVG({asString:true}));
            var key = [];for (l=stacks;l>0;l--){key[stacks-l] = colors[l-1].Name;}; 
            var svg1 = "<!--"+key+"-->" + paper.project.exportSVG({asString:true})
            var url = "data:image/svg+xml;utf8," + encodeURIComponent(svg1);
            var link = document.createElement("a");
            link.download = fileName;
            link.href = url;
            link.click();
            }


        if(event.key == "f") {
            floatingframe();
            
        }
        
        if(event.key == "1") {
            frameColor = {"Hex":"#4C46380", "Name":"Black"};
            fileName = "FramedBlack-"+$fx.hash;
            woodframe.style = {fillColor: frameColor.Hex}
        }
        if(event.key == "2") {
            frameColor = {"Hex":"#f9f9f9","Name":"White"};
            fileName = "FramedWhite-"+$fx.hash;
            woodframe.style = {fillColor: frameColor.Hex}
        }
        if(event.key == "3") {
            frameColor = {"Hex":"#60513D","Name":"Walnut"};
            fileName = "FramedWalnut-"+$fx.hash;
            woodframe.style = {fillColor: frameColor.Hex}
        }
        if(event.key == "4") {
            frameColor = {"Hex":"#ebd9c0","Name":"Maple"};
            fileName = "FramedMaple-"+$fx.hash;
            woodframe.style = {fillColor: frameColor.Hex}
        }
            
        if(event.key == "V") {
            fileName = "Vector-"+$fx.hash;
        }  


       //Format for Lightburn
       if(event.key == "b") {
        fileName = "blueprint-"+$fx.hash;
            for (z=0;z<stacks;z++){
                sheet[z].style = {fillColor: null,strokeWidth: .1,strokeColor: lightburn[stacks-z-1].Hex,shadowColor: null,shadowBlur: null,shadowOffset: null}
                sheet[z].selected = true;}
            }

       //Format for plotting
       if(event.key == "l") {
            fileName = "Plotting-"+$fx.hash;

            for (z=0;z<stacks;z++){
            sheet[z].style = {fillColor: null,strokeWidth: .1,strokeColor: plottingColors[stacks-z-1].Hex,shadowColor: null,shadowBlur: null,shadowOffset: null}
            sheet[z].selected = true;
            }
        
            for (z=0;z<stacks;z++){
                if (z<stacks-1){
                    for (zs=z+1;zs<stacks;zs++){
                        var _old = sheet[z];
                        sheet[z] = clipSubtract(_old, sheet[zs]);
                        _old.remove();
                    }
                } 
                console.log("optimizing")
            }
        }

        //new hash
        if(event.key == " ") {
            setquery("fxhash",null);
            location.reload();
            }

        //help
       if(event.key == "h" || event.key == "/") {
            alert(interactiontext);
            }
             
        //Save as PNG
        if(event.key == "p") {
            canvas.toBlob(function(blob) {saveAs(blob, fileName+'.png');});
            }

        //Export colors as txt
        if(event.key == "c") {
            content = JSON.stringify(features,null,2);
            console.log(content);
            var filename = "Colors-"+$fx.hash + ".txt";
            var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
            saveAs(blob, filename);
            }

        //send to studio.shawnkemp.art -
        if(event.key == "s") {
            sendAllExports()
            }  

       //Explode the layers     
       if(event.key == "e") {   
            //floatingframe();  
            h=0;t=0;maxwidth=3000;
               for (z=0; z<sheet.length; z++) { 
               sheet[z].scale(1000/2300)   
               sheet[z].position = new Point(wide/2,high/2);        
                    sheet[z].position.x += wide*h;
                    sheet[z].position.y += high*t;
                    sheet[z].selected = true;
                    if (wide*(h+2) > panelWide) {maxwidth=wide*(h+1);h=0;t++;} else{h++};
                    }  
            paper.view.viewSize.width = maxwidth;
            paper.view.viewSize.height = high*(t+1);
           }
 
}, false); 
}