"use strict";

var canvas;
var gl;
var program;

var numPositions  = 0;

var patch_positions = [];
var normals=[];
var tex_coords=[];

var DeltaH=0.25;
var DeltaR=0.25;
var DeltaA=3;

var DeltaHLight=0.5;
var DeltaRLight=0.5;
var DeltaALight=3;

var H=0;
var R=20;
var A=radians(35);

var light2H=0;
var light2R=10;
var light2A=radians(35);

var currentProjection=0;

var modelViewMatrixLoc;
var projectionMatrixLoc;

var nBuffer;
var normalLoc;
var vBuffer;
var positionLoc;
var tBuffer;
var textureLoc;

var material_ambient=vec3(0.2, 0.2, 0.2);
var material_diffuse=vec3(0.9, 0.1, 0.1);
var material_specular=vec3(0.8, 0.8, 0.8);
var material_shininess=80.0;


var light1_ambient= vec3(0.2, 0.2, 0.2);
var light1_diffuse = vec3(0.6, 0.6, 0.6);
var light1_specular =vec3(1.0, 1.0, 1.0); 
var light1_position

var ambientProduct1;
var diffuseProduct1;
var specularProduct1;

var light2_ambient= vec3(0.1, 0.1, 0.1);
var light2_diffuse = vec3(0.6, 0.6, 0.6);
var light2_specular =vec3(1.0, 1.0, 1.0); 
var light2_position;

var ambientProduct2;
var diffuseProduct2;
var specularProduct2;


var control_points=[
    [vec3(0.0,0.0,0.0), vec3(0.0,2.0,1.1), vec3(0.0,4.0,-0.5), vec3(0.0,6.0,0.3)],
    [vec3(2.0,0.0,1.5), vec3(2.0,2.0,3.9), vec3(2.0,4.0,2.6), vec3(2.0,6.0,-1.1)],
    [vec3(4.0,0.0,2.9), vec3(4.0,2.0,3.1), vec3(4.0,4.0,2.4), vec3(4.0,6.0,1.3)],
    [vec3(6.0,0.0,0.0), vec3(6.0,2.0,0.7), vec3(6.0,4.0,0.4), vec3(6.0,6.0,-0.2)]

];

var num_u=10;
var num_v=10;





window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);


    //event listener for projection menu
    var projectionMenu =  document.getElementById("projectionMenu");
    projectionMenu.addEventListener("click", function(){
        switch(projectionMenu.selectedIndex){
            case 0://parallel
                currentProjection=0;
                render();
               
                break;
            case 1://perspective
                currentProjection=1;
                render();
               
                break;
        }
    });

    //key press event listener
    window.addEventListener("keydown",function() {
        switch(event.keyCode){
            case 65: //A increase H camera
                
                H+=DeltaH;
                render();
                break;
            case 83: //S decrease H camera
    
                H-=DeltaH;
                render();
                break;
            case 68: //D increase R camera
               
                R+=DeltaR;
                render();
                break;
            case 70: //F decrease R camera
               
                if((R-DeltaR)>0){
                    R-=DeltaR;
                }
                render();
                break;
            case 71: //G increase angle camera
                
                A+=radians(DeltaA);
                render();
                break;
            case 72: //H decrease angle camera
                
                A-=radians(DeltaA);
                render();
                break;
            case 82: //R reset
                H=0;
                R=20;
                A=radians(35);


                currentProjection=0;

                light2H=0;
                light2R=10;
                light2A=radians(35);


                render();
                break;

            case 90: //Z increase H light
                //window.alert("increase Height Light");
                light2H+=DeltaHLight;
                render();
                break;

            case 88: //X decrease H light
                //window.alert("decrease Height Light");
                light2H-=DeltaHLight;
                render();
                break;

            case 67: //C increase R light
                //window.alert("increase radius Light");
                light2R+=DeltaRLight;
                render();
                break;

            case 86: // V decrease R light
                //window.alert("decrease radius Light");
                
                if(light2R-DeltaRLight>0){
                    light2R-=DeltaRLight;
                }
                render();
                break;
            
            case 66: // B increase A light
                //window.alert("increase angle Light");
                light2A+=radians(DeltaALight);
                render();
                break;

            case 78: // N decrease A light
                //window.alert("decrease angle Light");
                light2A-=radians(DeltaALight);
                render();
                break;
            

        }
    });
    var texture=loadTexture("wood-texture.jpg");
    generate_bez_points(control_points,num_u,num_v);
    render();
}

function generate_bez_points(control_points, num_u, num_v){
    var vPositionsSub=[];
    var positions_2D=[];
    var faces=[];
    var verticies=[];
    var subNormals=[];
    normals=[];
    patch_positions=[];
    tex_coords=[];
    numPositions=0;
    var sub_tex_coords=[];
    
    //generate positions in a 2d array
    for(var a=0;a<num_u;a++)
    {
        var u=a/(num_u-1);
        for(var b=0;b<num_u;b++)
        {
            var v=b/(num_v-1);
            var bez_point=generate_one_bez_point(control_points,u,v);
            vPositionsSub.push(bez_point);
            verticies.push(bez_point);
            subNormals.push(vec3(0.0,0.0,0.0));
            sub_tex_coords.push(vec2(u,v));
            
    
        }
        positions_2D.push(vPositionsSub);
        vPositionsSub=[];
    }

    //define triangle faces
    for (var i=0;i<=num_u-2;i++)
    {
        for(var j=0;j<=num_v-2;j++)
        {
            faces.push(vec3((num_u*i)+j, num_u*(i+1)+j, (num_u*(i+1))+(j+1)));

            faces.push(vec3((num_u*i)+j, (num_u*(i+1))+(j+1), (num_u*i)+(j+1)));
        }
    }

    //calculate normals + push positions, normals
    for(var c in faces) {
        var a = subtract(verticies[(faces[c][1])],verticies[(faces[c][0])]);
        var b = subtract(verticies[(faces[c][2])],verticies[(faces[c][0])]);
        var n = cross(a,b);
        
        subNormals[(faces[c][0])]=add(subNormals[(faces[c][0])],n);
        subNormals[(faces[c][1])]=add(subNormals[(faces[c][1])],n);
        subNormals[(faces[c][2])]=add(subNormals[(faces[c][2])],n);

        //push verticies
        patch_positions.push(verticies[faces[c][0]]);
        patch_positions.push(verticies[faces[c][1]]);
        patch_positions.push(verticies[faces[c][2]]);
        numPositions+=3;

        //push textures
        tex_coords.push(sub_tex_coords[faces[c][0]]);
        tex_coords.push(sub_tex_coords[faces[c][1]]);
        tex_coords.push(sub_tex_coords[faces[c][2]]);
        


    }

    //normalize normals
    for(var l in subNormals){
        subNormals[l]=normalize(subNormals[l]);
    }

     //push normals
    for(var k in faces) {
        normals.push(subNormals[faces[k][0]]);
        normals.push(subNormals[faces[k][1]]);
        normals.push(subNormals[faces[k][2]]);
    }




}

function generate_one_bez_point(control_points,u,v){
    var bez_point=vec3(0.0,0.0,0.0);
    var bi;
    var bj;
    for(var i=0;i<=3;i++)
    {
        for(var j=0;j<=3;j++)
        {
            bi=blending_functions(i,u);
            bj=blending_functions(j,v);
            var current_control_point=control_points[i][j];
            var product= mult(bi,mult(bj,current_control_point));
            bez_point=add(bez_point,product);
        }
    }
    return bez_point;
}


function blending_functions(i,u){
    var result;
    switch(i){
        case 0:
            result= Math.pow((1-u),3);
            break;
        case 1:
            result=(3*u)*Math.pow((1-u),2);
            break;
        case 2:
            result=3*Math.pow(u,2)*(1-u);
            break;
        case 3:
            result=Math.pow(u,3);
            break;
    }
    return result;
}


function configureTexture(texture, image){
    gl.bindTexture( gl.TEXTURE_2D, texture );
    if (image) { 
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image );
        gl.generateMipmap( gl.TEXTURE_2D );
    } else {
        let pixel = new Uint8Array([150, 0, 150, 255]); // dark blue pixel
        gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel );
    }
}

function loadTexture(url){
    let texture = gl.createTexture();
    let image = new Image();

    // put in placeholder image data until actual image loads.
    configureTexture(texture, null);
    image.addEventListener("error", (event) => {
    console.log(`error evt: ${JSON.stringify(event)}`);
    });

    image.addEventListener("load", (event) => {
    configureTexture(texture, image);
    window.requestAnimationFrame(render);
    });
    image.crossOrigin = "Anonymous";
    image.src = url + "?dont-use-cache";
    return texture;
}



function render()
{

    program = initShaders(gl,"vertex-shader-phong" , "fragment-shader-phong");
    gl.useProgram(program);
    

    //
    //  Load shaders and initialize attribute buffers
    //

    //normals
    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    normalLoc = gl.getAttribLocation( program, "aNormal");
    gl.vertexAttribPointer( normalLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( normalLoc );

    //position
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(patch_positions), gl.STATIC_DRAW);


    positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    //texture
    tBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex_coords), gl.STATIC_DRAW);

    textureLoc = gl.getAttribLocation( program, "aTexCoord");
    gl.enableVertexAttribArray( textureLoc );
    gl.vertexAttribPointer( textureLoc, 2, gl.FLOAT, false, 0, 0 );

    
    
    //glTexImage2D(gl.TEXTURE_2D, 0, gl.RGB, 512, 512, 0, gl.RGB, gl.UNSIGNED_BYTE, my_texels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(gl.getUniformLocation(program, "utexture"), 0);


    //
    //assign uniform variables
    //

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc=gl.getUniformLocation(program, "projectionMatrix");

    //camera light calculations
    ambientProduct1=mult(light1_ambient,material_ambient);
    specularProduct1=mult(light1_specular,material_specular);
    light1_position=vec3(0.0,0.2,0.0);

    gl.uniform3fv(gl.getUniformLocation(program,"ambientProduct1"), flatten(ambientProduct1));
    gl.uniform3fv(gl.getUniformLocation(program,"material_diffuse"), flatten(material_diffuse));
    gl.uniform3fv(gl.getUniformLocation(program,"specularProduct1"), flatten(specularProduct1));
    gl.uniform3fv(gl.getUniformLocation(program,"light1_position"), flatten(light1_position));
    gl.uniform3fv(gl.getUniformLocation(program,"light1_diffuse"), flatten(light1_diffuse));
    gl.uniform1f(gl.getUniformLocation(program,"shininess"),material_shininess);


    //moving light calculations
    ambientProduct2=mult(light2_ambient,material_ambient);
    specularProduct2=mult(light2_specular,material_specular);
    light2_position=vec3(light2R*Math.cos(light2A),light2H,light2R*Math.sin(light2A)); //model coordinates

    gl.uniform3fv(gl.getUniformLocation(program,"ambientProduct2"), flatten(ambientProduct2));
    gl.uniform3fv(gl.getUniformLocation(program,"specularProduct2"), flatten(specularProduct2));
    gl.uniform3fv(gl.getUniformLocation(program,"light2_position"), flatten(light2_position));
    gl.uniform3fv(gl.getUniformLocation(program,"light2_diffuse"), flatten(light2_diffuse));

    //
    //beginning of traditional render function
    //
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye=vec3(R*Math.cos(A),H,R*Math.sin(A));
    var at=vec3(3.0,3.0,0.0);
    var up=vec3(0.0,1.0, 0.0);

    var fovy=45;
    var aspect=1;
    var near=0.01;
    var far=200;
    var left=-6;
    var right=6;
    var bottom=-6;
    var top=6;

    var projectionMatrix;
   
    var modelViewMatrix=lookAt(eye, at, up);

    if(currentProjection==1){//perspective
        projectionMatrix=perspective(fovy, aspect, near, far);
    }
    else if(currentProjection==0){//parallel
        projectionMatrix=ortho(left, right,bottom, top, near, far);
    }

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numPositions);
}
