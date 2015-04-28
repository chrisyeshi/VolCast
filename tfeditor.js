var TfEditor = function(option){
  "use strict";

  /* Private Variabales and Functions */
  var that = this,
      width = option.width || 512,
      height = option.height || 200,
      margin = option.margin || 0,
      padding = option.padding || 0,
      onTfChange = option.onTfChange || null,
      containerId = option.container || "body",
      container,
      editor,
      colorSelector,
      tfData = [];

  container = (containerId == "body")
    ?document.getElementsByTagName("body")[0]
    :document.getElementById(containerId);

  editor = document.createElement("canvas");
  editor.width = width;
  editor.height = height * 0.75;

  container.appendChild(editor);

  editor._context = editor.getContext("2d");
  editor._mouseDown = false;
  editor._startX = 0;

  _setupEditor();
  _updateEditor();

  editor.onmousedown = function(evt) {
      editor._mouseDown = true;
      var mousePos = _getMousePos(editor, evt);
      editor._startX = mousePos.x;
  };

  editor.onmousemove = function(evt) {
    if (editor._mouseDown){
      var mousePos = _getMousePos(editor, evt);
      if(mousePos.x >= editor._startX){
        for(var i = editor._startX; i<mousePos.x; i++){
          tfData[4*i+3] = editor.height - mousePos.y;
        }
      } else {
        for(var i = editor._startX; i>mousePos.x; i--){
          tfData[4*i+3] = editor.height - mousePos.y;
        }
      }

      editor._startX = mousePos.x;
      _updateEditor();
      that.onTfChange(tfData);
      //onTfChange(tfData);
      // volren.setTransFunc(tfData);
      // volren.paintGL();
    }
  };

  editor.onmouseup = function(evt) {
    editor._mouseDown = false;
  };

  function _getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  function _setupEditor(){
    var grd = editor._context.createLinearGradient(0,0, editor.width ,0);

    grd.addColorStop(0,"red");
    grd.addColorStop(0.5,"green");
    grd.addColorStop(1,"blue");;
    editor._context.fillStyle= grd;
    editor._context.fillRect(0, 0, editor.width, editor.height);

    for(var i=0; i<editor.width; i++){
      var cData = editor._context.getImageData(i,1,1,1).data;
      tfData.push(cData[0]);
      tfData.push(cData[1]);
      tfData.push(cData[2]);
      tfData.push(0);
    }
  }

  function _updateEditor(){
    var ctx = editor._context;
    ctx.clearRect(0, 0, editor.width, editor.height); // Clears the editor canvas
    // ctx.fillStyle = grd;
    ctx.fillRect(0, 0, editor.width, editor.height);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, editor.height);

    for(var i=0; i<editor.width; i++){
      ctx.lineTo(i, editor.height - tfData[4*i+3]);
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
  }

  /* Public Variables and Functions */
  this.onTfChange = option.onTfChnage || function(){};

  this.resize = function(w, h){
    width = w;
    height = h;
    editor.width = w;
    editor.height = h * 0.75;
  };

};
