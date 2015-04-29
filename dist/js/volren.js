var volren = function() {

	//
	//
	// Public Functions
	//
	//

	function init(can) {
        try {
        	canvas = can;
            context = canvas.getContext("experimental-webgl");

            // check parameters
            var maxTexSize = context.getParameter(this.context.MAX_TEXTURE_SIZE);
            console.log("MAX_TEXTURE_SIZE = " + maxTexSize);

        } catch (e) {
        }
        if (!context) {
            alert("GLCanvas:: Could not initialise WebGL, sorry :-(");
        }
	}

	function initializeGL() {
		context.clearColor(0.0, 0.0, 0.0, 0.0);
		context.enable(context.DEPTH_TEST);
		// context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA);
		// context.enable(context.BLEND);
		initMVP();
		initShaders();
		initBuffers();
		initFramebuffers();
	}

	function paintGL() {
		if (!texVol)
			return;

		drawEntrExitTextures();
		// full screen quad
		context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

		context.activeTexture(context.TEXTURE0);
		context.bindTexture(context.TEXTURE_2D, texEntr);
		context.activeTexture(context.TEXTURE1);
		context.bindTexture(context.TEXTURE_2D, texExit);
		context.activeTexture(context.TEXTURE2);
		context.bindTexture(context.TEXTURE_2D, texVol);
		context.activeTexture(context.TEXTURE3);
		context.bindTexture(context.TEXTURE_2D, texTf);
		context.useProgram(progQuad);
		// uniforms
		progQuad.uniformTexEntr = context.getUniformLocation(progQuad, 'texEntr');
		progQuad.uniformTexExit = context.getUniformLocation(progQuad, 'texExit');
		progQuad.uniformTexVol  = context.getUniformLocation(progQuad, 'texVol');
		progQuad.uniformTexTf   = context.getUniformLocation(progQuad, 'texTf');
		context.uniform1i(progQuad.uniformTexEntr, 0);
		context.uniform1i(progQuad.uniformTexExit, 1);
		context.uniform1i(progQuad.uniformTexVol,  2);
		context.uniform1i(progQuad.uniformTexTf,   3);

		context.bindBuffer(context.ARRAY_BUFFER, vboQuad);
		context.vertexAttribPointer(progQuad.attribVert, vboQuad.nFloatsPerVert, context.FLOAT, false, 0, 0);
		context.vertexAttribPointer(progQuad.attribTexCoord, vboQuad.nFloatsPerVert, context.FLOAT, false, 0, vboQuad.nVerts * vboQuad.nFloatsPerVert * Float32Array.BYTES_PER_ELEMENT);
		context.bindBuffer(context.ARRAY_BUFFER, null);

		context.drawArrays(context.TRIANGLE_FAN, 0, vboQuad.nVerts);

		context.useProgram(null);
		context.activeTexture(context.TEXTURE3);
		context.bindTexture(context.TEXTURE_2D, null);
		context.activeTexture(context.TEXTURE2);
		context.bindTexture(context.TEXTURE_2D, null);
		context.activeTexture(context.TEXTURE1);
		context.bindTexture(context.TEXTURE_2D, null);
		context.activeTexture(context.TEXTURE0);
		context.bindTexture(context.TEXTURE_2D, null);
	}

	function resizeGL() {
		context.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
		mat4.identity(pMatrix);
		mat4.perspective(pMatrix, fovy, canvas.clientWidth / canvas.clientHeight, 0.01, 1000.0);
		paintGL();
	}

	function mousePressEvent(e) {
	}

	function mouseMoveEvent(e) {
		// console.log(JSON.stringify(e));
		if (0 === e.button) {
			// left button
			// view coordinate
			var s = vec3.create();
			var t = vec3.create();
			var u = vec3.create();
			vec3.sub(u, eye, focal);
			vec3.normalize(u, u);
			vec3.cross(s, u, up);
			vec3.normalize(s, s);
			vec3.cross(t, s, u);
			vec3.normalize(t, t);
			// scale by mouse movement
			var ss = vec3.create();
			var st = vec3.create();
			vec3.scale(ss, s, e.movement.x);
			vec3.scale(st, t, e.movement.y);
			var rotateTo = vec3.create();
			vec3.add(rotateTo, ss, st);
			var rotateAround = vec3.create();
			vec3.cross(rotateAround, u, rotateTo);
			vec3.normalize(rotateAround, rotateAround);
			var angle = e.movement.x * e.movement.x + e.movement.y * e.movement.y;
			angle = angle / canvas.clientHeight * 0.25 * Math.PI;
			// rotate matrix
			var rotateMatrix = mat4.create();
			mat4.rotate(rotateMatrix, rotateMatrix, angle, rotateAround);
			// rotate the view vector
			var newU = vec3.create();
			vec3.transformMat4(newU, u, rotateMatrix);
			vec3.normalize(newU, newU);
			// update vector s and t
			var newS = vec3.create();
			vec3.cross(newS, newU, t);
			vec3.normalize(newS, newS);
			var newT = vec3.create();
			vec3.cross(newT, newS, newU);
			vec3.normalize(newT, newT);
			// update camera parameters
			var focalLength = vec3.distance(eye, focal);
			var newFocal = vec3.clone(focal);
			var newEye = vec3.create();
			vec3.scaleAndAdd(newEye, newFocal, newU, focalLength);
			var newUp = vec3.clone(newT);
			// copy to the orignal vectors
			vec3.copy(eye, newEye);
			vec3.copy(focal, newFocal);
			vec3.copy(up, newUp);

			initMVP();
			paintGL();

		} else if (1 === e.button) {
			// middle button
		} else if (2 === e.button) {
			// right button
		}
	}

	function mouseReleaseEvent(e) {
	}

	//
	//
	// Private Functions
	//
	//

	function mvp() {
		var m = mat4.create();
		mat4.mul(m, vMatrix, mMatrix);
		mat4.mul(m, pMatrix, m);
		return m;
	}

    function getShader(id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = context.createShader(context.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = context.createShader(context.VERTEX_SHADER);
        } else {
            return null;
        }

        context.shaderSource(shader, str);
        context.compileShader(shader);

        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
            alert(context.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    function initMVP() {
    	mat4.identity(mMatrix);
    	mat4.identity(vMatrix);
    	mat4.lookAt(vMatrix, eye, focal, up);
    	mat4.identity(pMatrix);
    	mat4.perspective(pMatrix, fovy, canvas.clientWidth / canvas.clientHeight, 0.01, 1000.0);
    }

	function initShaders() {
		// progCube
		var vert = getShader('shader-vs');
		var frag = getShader('shader-fs');
		progCube = context.createProgram();
		context.attachShader(progCube, vert);
		context.attachShader(progCube, frag);
		context.linkProgram(progCube);
		context.useProgram(progCube);
		progCube.uniformMVP = context.getUniformLocation(progCube, 'mvp');
		progCube.attribVert = context.getAttribLocation(progCube, 'vertex');
		context.enableVertexAttribArray(progCube.attribVert);
		progCube.attribTexCoord = context.getAttribLocation(progCube, 'vTexCoord');
		context.enableVertexAttribArray(progCube.attribTexCoord);
		context.useProgram(null);
		// progQuad
		var quadVert = getShader('quad-vs');
		var quadFrag = getShader('quad-fs');
		progQuad = context.createProgram();
		context.attachShader(progQuad, quadVert);
		context.attachShader(progQuad, quadFrag);
		context.linkProgram(progQuad);
		context.useProgram(progQuad);
		progQuad.attribVert = context.getAttribLocation(progQuad, 'vertex');
		context.enableVertexAttribArray(progQuad.attribVert);
		progQuad.attribTexCoord = context.getAttribLocation(progQuad, 'vTexCoord');
		context.enableVertexAttribArray(progQuad.attrubTexCoord);
		progQuad.uniformTexEntr = context.getUniformLocation(progQuad, 'texEntr');
		progQuad.uniformTexExit = context.getUniformLocation(progQuad, 'texExit');
		progQuad.uniformTexVol  = context.getUniformLocation(progQuad, 'texVol');
		context.uniform1i(progQuad.uniformTexEntr, 0);
		context.uniform1i(progQuad.uniformTexExit, 1);
		context.uniform1i(progQuad.uniformTexVol,  2);
		context.useProgram(null);
	}

	function initBuffers() {
		// vbo
		var verts = [
			// vertex
			 0.0,  0.0,  0.0,
			32.0,  0.0,  0.0,
			 0.0, 32.0,  0.0,
			32.0, 32.0,  0.0,
			 0.0,  0.0, 32.0,
			32.0,  0.0, 32.0,
			 0.0, 32.0, 32.0,
			32.0, 32.0, 32.0,
			// texCoord
			 0.0,  0.0,  0.0,
			 1.0,  0.0,  0.0,
			 0.0,  1.0,  0.0,
			 1.0,  1.0,  0.0,
			 0.0,  0.0,  1.0,
			 1.0,  0.0,  1.0,
			 0.0,  1.0,  1.0,
			 1.0,  1.0,  1.0,
		];
		vboCube = context.createBuffer();
		vboCube.nVerts = 8;
		vboCube.nFloatsPerVert = 3;
		context.bindBuffer(context.ARRAY_BUFFER, vboCube);
		context.bufferData(context.ARRAY_BUFFER, new Float32Array(verts), context.STATIC_DRAW);
		context.vertexAttribPointer(progCube.attribVert, vboCube.nFloatsPerVert, context.FLOAT, false, 0, 0);
		context.vertexAttribPointer(progCube.attribTexCoord, vboCube.nFloatsPerVert, context.FLOAT, false, 0, vboCube.nVerts * vboCube.nFloatsPerVert * Float32Array.BYTES_PER_ELEMENT);
		context.bindBuffer(context.ARRAY_BUFFER, null);
		// ibo
		var idx =  [
			0, 1, 2,	3, 2, 1,	// front
			4, 6, 5,	7, 5, 6,	// back
			0, 2, 4,	6, 4, 2,	// left
			1, 5, 3,	7, 3, 5,	// right
			2, 3, 6,	7, 6, 3,	// top
			0, 4, 1,	5, 1, 4		// bottom
		];
		iboCube = context.createBuffer();
		context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, iboCube);
		context.bufferData(context.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), context.STATIC_DRAW);
		context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, null);
		iboCube.nNumbers = 36;
		// vbo quad
		var quadVerts = [ -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
						   0.0,  0.0, 1.0,  0.0, 1.0, 1.0,  0.0, 1.0 ];
		vboQuad = context.createBuffer();
		vboQuad.nVerts = 4;
		vboQuad.nFloatsPerVert = 2;
		context.bindBuffer(context.ARRAY_BUFFER, vboQuad);
		context.bufferData(context.ARRAY_BUFFER, new Float32Array(quadVerts), context.STATIC_DRAW);
		context.vertexAttribPointer(progQuad.attribVert, vboQuad.nFloatsPerVert, context.FLOAT, false, 0, 0);
		context.vertexAttribPointer(progQuad.attribTexCoord, vboQuad.nFloatsPerVert, context.FLOAT, false, 0, vboQuad.nVerts * vboQuad.nFloatsPerVert * Float32Array.BYTES_PER_ELEMENT);
		context.bindBuffer(context.ARRAY_BUFFER, null);
	}

	function initFramebuffers() {
		fboEntrExit = context.createFramebuffer();
		context.bindFramebuffer(context.FRAMEBUFFER, fboEntrExit);
		fboEntrExit.width = 1024;
		fboEntrExit.height = 1024;

		texExit = context.createTexture();
		context.bindTexture(context.TEXTURE_2D, texExit);
		context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
		context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
		context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, fboEntrExit.width, fboEntrExit.height, 0, context.RGBA, context.UNSIGNED_BYTE, null);

		context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, texExit, 0);

		context.bindTexture(context.TEXTURE_2D, null);
		context.bindFramebuffer(context.FRAMEBUFFER, null);

		texEntr = context.createTexture();
		context.bindTexture(context.TEXTURE_2D, texEntr);
		context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
		context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
		context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, fboEntrExit.width, fboEntrExit.height, 0, context.RGBA, context.UNSIGNED_BYTE, null);
		context.bindTexture(context.TEXTURE_2D, null);
	}

	function drawEntrExitTextures() {
		// draw cube
		context.bindFramebuffer(context.FRAMEBUFFER, fboEntrExit);
		context.viewport(0, 0, 1024, 1024);

		context.bindBuffer(context.ARRAY_BUFFER, vboCube);
		context.vertexAttribPointer(progCube.attribVert, vboCube.nFloatsPerVert, context.FLOAT, false, 0, 0);
		context.vertexAttribPointer(progCube.attribTexCoord, vboCube.nFloatsPerVert, context.FLOAT, false, 0, vboCube.nVerts * vboCube.nFloatsPerVert * Float32Array.BYTES_PER_ELEMENT);
		context.bindBuffer(context.ARRAY_BUFFER, null);

		context.useProgram(progCube);
		context.uniformMatrix4fv(progCube.uniformMVP, false, mvp());
		context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, iboCube);
		context.enable(context.CULL_FACE);

		// draw the back face
		context.cullFace(context.BACK);
		context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, texExit, 0);
		context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
		context.drawElements(context.TRIANGLES, iboCube.nNumbers, context.UNSIGNED_SHORT, 0);

		// draw the front face
		context.cullFace(context.FRONT);
		context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, texEntr, 0);
		context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
		context.drawElements(context.TRIANGLES, iboCube.nNumbers, context.UNSIGNED_SHORT, 0);

		context.disable(context.CULL_FACE);
		context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, null);
		context.useProgram(null);

		context.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
		context.bindFramebuffer(context.FRAMEBUFFER, null);
	}

	function setVolume(volume) {
		texVol = context.createTexture();
		context.bindTexture(context.TEXTURE_2D, texVol);
		context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
		context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
		context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
		context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
		context.texImage2D(context.TEXTURE_2D, 0, context.ALPHA, 32, 32 * 32, 0, context.ALPHA, context.UNSIGNED_BYTE, volume);
		context.bindTexture(context.TEXTURE_2D, null);
	}

	function setTransFunc(tfData) {
		// console.log("transfer function resolution: ", tfData.length);
		texTf = context.createTexture();
		context.bindTexture(context.TEXTURE_2D, texTf);
		context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
		context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
		context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
		context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
		context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, tfData.length/4, 1, 0, context.RGBA, context.UNSIGNED_BYTE, new Uint8Array(tfData));
		context.bindTexture(context.TEXTURE_2D, null);
	}

	//
	//
	// Variables
	//
	//

	var canvas = null;
	var context = null;
	var mMatrix = mat4.create();
	var vMatrix = mat4.create();
	var pMatrix = mat4.create();
	var progCube;
	var progQuad;
	var vboCube;
	var iboCube;
	var vboQuad;
	var fboEntrExit;
	var texExit;
	var texEntr;
	var texVol = null;
	var texTf = null;
	var eye = [16.0, 16.0, 64.0];
	var focal = [16.0, 16.0, 16.0];
	var up = [0.0, 1.0, 0.0];
	var fovy = 60.0 / 180.0 * Math.PI;

	//
	//
	// Return Object
	//
	//

	return {
		init: init,
		initializeGL: initializeGL,
		paintGL: paintGL,
		resizeGL: resizeGL,
		mousePressEvent: mousePressEvent,
		mouseMoveEvent: mouseMoveEvent,
		mouseReleaseEvent: mouseReleaseEvent,
		setVolume: setVolume,
		setTransFunc: setTransFunc
	}
}();
