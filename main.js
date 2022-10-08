const getElem = id => document.getElementById(id);

const coll = document.getElementsByClassName('collapsible');

for (let i = 0; i < coll.length; i++) {
    let elem = coll[i];
    elem.toggleActive = () => {
        elem.classList.toggle('active');
        let content = elem.nextElementSibling;
        if (content.style.height) {
            content.style.height = null;
        } else {
            content.style.height = `${content.scrollHeight + 10}px`;
        }
    }
    if (elem.classList.contains('open')) elem.toggleActive();
    elem.addEventListener('click', () => elem.toggleActive());
}

const degToRad = deg => (deg * Math.PI) / 180.0;
const radToDeg = rad => (rad * 180.0) / Math.PI;

const getElemValue = (id, type) => {
    let elem = getElem(id);
    switch (type) {
        case 'string':
            return elem.value.toString();
        case 'int':
            return parseInt(elem.value);
        case 'float':
            return parseFloat(elem.value.toString);
        default:
            return elem.value;
    }
}
window.pressedBinds = [];
const isKeyPressed = (key) => {
    let isIn = pressedBinds.indexOf(key) > -1;
    return isIn;
}
const basicKeybind = (key, callback, repeat = false) => {
    window.addEventListener('keydown', (e) => {
        if (e.key === key) {
            if (!isKeyPressed(key)) {
                pressedBinds.push(key);
                callback(true, e);
            } else if (repeat) {
                callback(true, e);
            }
        }
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === key) {
            let i = pressedBinds.indexOf(key);
            pressedBinds.splice(i, 1);
            callback(false, e);
        }
    });
}

dataUrlToBlobUrl = (dataurl) => {
    const base64ImageData = dataurl;
    const contentType = 'image/png';

    const byteCharacters = atob(base64ImageData.substr(`data:${contentType};base64,`.length));
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }
    const blob = new Blob(byteArrays, { type: contentType });
    const blobUrl = URL.createObjectURL(blob);
    return blobUrl;
}

//TODO Allow canvas resizing

//TODO Props
//todo - act like objects DONE
//todo - selectable while holding control DONE
//todo - saved in editor settings DONE
//todo - save their types DONE
//todo - clone existing
//TODO Background acts like prop

document.body.style.zoom = 1;
window.settings = {
    default: {
        snapRotation: true,
        snapRadius: 15,
        relExport: true,
        relSize: false,
        groupCoords: false,
        cWidth: 600,
        cHeight: 600,
        gSize: 50,
        oOpacity: 1,
        askReload: false
    },
    reset: () => {
        for (const key in settings.current) {
            settings.current.setKey(key, settings.default[key]);
        }
        localStorage.setItem('settings', JSON.stringify(settings.current));
        if (confirm('Your settings have been reset, would you like to reload the page for them to apply?'))
            location.reload();
    },
    setAll: (settings) => {
        settings.current = { ...settings };
        localStorage.setItem('settings', JSON.stringify(settings.current));
    },
    setKey: (key, value) => {
        settings.current[key] = value;
        localStorage.setItem('settings', JSON.stringify(settings.current));
    },
    getKey: key => settings.current[key]
};
try {
    if (localStorage.getItem('settings') !== '{}' && localStorage.getItem('settings') !== null) {
        settings.current = JSON.parse(localStorage.getItem('settings'));
    } else {
        throw 'ass';
    }
} catch (e) {
    settings.current = { ...settings.default };
}
for (const key in settings.current) {
    if (!Object.hasOwnProperty.call(settings.default, key)) {
        delete settings.current[key];
    }
}
for (const key in settings.default) {
    if (!Object.hasOwnProperty.call(settings.current, key)) {
        settings.setKey(key, settings.default[key]);
    }
}
localStorage.setItem('settings', JSON.stringify(settings.current));

/**
 * Creates a new setting
 * @description Gark wrote this
 * @param {String} name setting name
 * @param {('float'|'int'|'checkbox')} type setting type
 * @param {Function} callback called with value when setting changes
 * @param {Function} callback called with value after the function is ran
 */
const newSetting = (name, type, callback = () => { }, callbackFinish = () => { }) => {
    const htmlSetting = getElem(`sett_${name}`);
    const prop = type === 'checkbox' ? 'checked' : 'value';
    const parse = n => type === 'checkbox' ? n : +n;

    htmlSetting.onchange = e => {
        const parsedProp = parse(e.target[prop]);
        settings.setKey(name, parsedProp);
        callback(settings.getKey(name));
    }
    callbackFinish(htmlSetting[prop] = parse(settings.getKey(name)));
}

newSetting('snapRotation', 'checkbox');
newSetting('snapRadius', 'int');
newSetting('relExport', 'checkbox', v => {
    getElem('center').checked = v;
}, v => {
    getElem('center').checked = v;
});
newSetting('relSize', 'checkbox', v => {
    getElem('sizegrid').checked = v;
}, v => {
    getElem('sizegrid').checked = v;
});
newSetting('askReload', 'checkbox');
newSetting('cWidth', 'int', v => {
    getElem('cw').value = v;
}, v => {
    getElem('cw').value = v;
});
newSetting('cHeight', 'int', v => {
    getElem('ch').value = v;
}, v => {
    getElem('ch').value = v;
});
newSetting('gSize', 'int', v => {
    getElem('bgrid').value = v;
}, v => {
    getElem('bgrid').value = v;
});
newSetting('groupCoords', 'checkbox', v => {
    getElem('groupcoords').checked = v;
}, v => {
    getElem('groupcoords').checked = v;
});
newSetting('oOpacity', 'float', v => {
    if (shapes.length > 0) {
        shapes.forEach(shape => shape.opacity = v);
        canvas.renderAll();
    }
});

class SnapCanvas extends fabric.Canvas {
    constructor(canvas, size, options) {
        super(canvas, options);
        this.gridGranularity = size;
        this.bitchMode = false;
        this.on('object:scaling', this.onFabricObjectScaling.bind(this));
        this.on('object:scaled', this.onFabricObjectScaled.bind(this));
        this.on('object:moving', this.onFabricObjectMoving.bind(this));
        this.on('mouse:move', this.onFabricMouseMouseMove.bind(this));
        this.mouse = { x: this.gridGranularity, y: this.gridGranularity };
    }

    get gridSize() {
        return this.bitchMode ? this.gridGranularity / 2 : this.gridGranularity;
    }

    set gridSize(s) {
        this.gridGranularity = s;
    }

    snapGrid(cord) {
        return Math.round(cord / this.gridSize) * this.gridSize;
    }

    getSnappedMouse() {
        let x = this.snapGrid(this.mouse.x - this.gridSize / 2);
        let y = this.snapGrid(this.mouse.y - this.gridSize / 2);
        return { x, y };
    }

    onFabricMouseMouseMove(e) {
        this.mouse = { ...e.pointer };
    }

    onFabricObjectMoving(e) {
        e.target.set({
            left: this.snapGrid(e.target.left),
            top: this.snapGrid(e.target.top)
        });
    }

    onFabricObjectScaled(e) {
        switch (e.target.type) {
            case 'group':
                e.target.getObjects().forEach(obj => {
                    obj.set({
                        width: this.snapGrid(e.target.width * e.target.scaleX),
                        height: this.snapGrid(e.target.height * e.target.scaleY),
                    });
                });
                e.target.set({
                    width: this.snapGrid(e.target.width * e.target.scaleX),
                    height: this.snapGrid(e.target.height * e.target.scaleY),
                    scaleX: 1,
                    scaleY: 1,
                });
                break;
        }
    }

    onFabricObjectScaling(e) {
        if (e.target.type === 'activeSelection') {
            e.target.lockScalingX = true;
            e.target.lockScalingY = true;
        } else {
            e.target.lockScalingX = false;
            e.target.lockScalingY = false;
        }
        const active = this.getActiveObject();
        const [width, height] = [active.getScaledWidth(), active.getScaledHeight()];

        // X
        if (['tl', 'ml', 'bl'].indexOf(e.transform.corner) !== -1) {
            const tl = this.snapGrid(active.left);
            active.scaleX = (width + active.left - tl) / (active.width + active.strokeWidth);
            active.left = tl;
        } else if (['tr', 'mr', 'br'].indexOf(e.transform.corner) !== -1) {
            const tl = this.snapGrid(active.left + width);
            active.scaleX = (tl - active.left) / (active.width + active.strokeWidth);
        }

        // Y
        if (['tl', 'mt', 'tr'].indexOf(e.transform.corner) !== -1) {
            const tt = this.snapGrid(active.top);
            active.scaleY = (height + active.top - tt) / (active.height + active.strokeWidth);
            active.top = tt;
        } else if (['bl', 'mb', 'br'].indexOf(e.transform.corner) !== -1) {
            const tt = this.snapGrid(active.top + height);
            active.scaleY = (tt - active.top) / (active.height + active.strokeWidth);
        }

        // Avoid singularities
        active.scaleX = (active.scaleY >= 0 ? 1 : -1) * Math.max(Math.abs(active.scaleX), 0.001);
        active.scaleY = (active.scaleY >= 0 ? 1 : -1) * Math.max(Math.abs(active.scaleY), 0.001);
    }

}

window.selected = null;
window.addEventListener('beforeunload', function (event) {
    if (settings.current.askReload) {
        event.returnValue = 'deez nuts';
        event.stopPropagation();
        event.preventDefault();
    }
});

getElem('editor').style.display = 'none';

// Build using FabricJS v3.4

getElem('create').onclick = () => create();

getElem('import').onclick = () => Import();
const Import = () => {
    let json = window.prompt('Paste your JSON here.');
    let object = JSON.parse(json);
    let cRel = object.editorSettings.posRelativeCenter;
    let sRel = object.editorSettings.sizeRelativeToGrid;
    let c = create(object.width, object.height, object.editorSettings.gridSize, object.editorSettings.name, object);

    object.shapes.forEach(shape => {
        let width = shape.width;
        let height = shape.height;
        let gCoords = object.editorSettings.groupCoords;
        let x = gCoords ? shape.position.x : shape.x;
        let y = gCoords ? shape.position.y : shape.y;
        if (sRel) {
            width *= object.editorSettings.gridSize;
            height *= object.editorSettings.gridSize;
            x *= object.editorSettings.gridSize;
            y *= object.editorSettings.gridSize;
        }
        getElem('center').checked = cRel;
        getElem('sizegrid').checked = sRel;
        let left = cRel ? x - width / 2 + object.width / 2 : x;
        let top = cRel ? y - height / 2 + object.height / 2 : y;
        let s = addSquare(c, left, top, width, height);
        s.angle = radToDeg(shape.angle) || 0;

        let typeset = 'blue';
        if (shape.bullet !== undefined) {
            if (shape.bullet) {
                typeset = 'green';
            } else {
                typeset = 'red';
            }
        }

        s.changeType(typeset);
    });

    object.editorSettings.props.forEach(prop => {
        let width = prop.width;
        let height = prop.height;
        let propType = prop.propType;
        let source = prop.source;
        let gCoords = object.editorSettings.groupCoords;
        let x = gCoords ? prop.position.x : prop.x;
        let y = gCoords ? prop.position.y : prop.y;
        if (sRel) {
            width *= object.editorSettings.gridSize;
            height *= object.editorSettings.gridSize;
            x *= object.editorSettings.gridSize;
            y *= object.editorSettings.gridSize;
        }
        let left = cRel ? x - width / 2 + object.width / 2 : x;
        let top = cRel ? y - height / 2 + object.height / 2 : y;
        let angle = radToDeg(prop.angle) || 0;
        addProp(c, propType, source, undefined, left, top, angle);
    });

    for (const key in object.editorSettings.propTypes) {
        let value = object.editorSettings.propTypes[key];

        addPropType(key, value);
    }
}

const create = (cWidth, cHeight, gSize, bName, importObj) => {
    const cw = cWidth || getElemValue('cw', 'int');
    const ch = cHeight || getElemValue('ch', 'int');

    let htmlCanvas = getElem('c');
    htmlCanvas.width = cw;
    htmlCanvas.height = ch;

    window.canvas = new SnapCanvas('c', 10, {
        selection: true,
        fireRightClick: true,
        stopContextMenu: true,
        centeredKey: 'ctrlKey'
    });

    basicKeybind('Alt', (state, e) => {
        canvas.bitchMode = state;
    });
    basicKeybind('Control', (state, e) => {
        props.forEach(prop => prop.selectable = state);
        shapes.forEach(shape => shape.selectable = !state);
    });
    basicKeybind('r', state => {
        if (!state) return;
        let { x, y } = canvas.getSnappedMouse();
        addSquare(canvas, x, y);
    });
    basicKeybind('e', state => {
        if (!state) return;
        let obj = canvas.getActiveObject();
        if (!obj) return;
        obj.cycleType(1);
    });
    basicKeybind('q', state => {
        if (!state) return;
        let obj = canvas.getActiveObject();
        if (!obj) return;
        obj.cycleType(-1);
    });
    /*
    basicKeybind('w', state => {
        if (!state) return;
        let obj = canvas.getActiveObject();
        if (!obj) return;
        if (!isKeyPressed(' ')) {
            obj.top -= canvas.gridSize;
        } else {
            obj.height += canvas.gridSize;
            obj.top -= canvas.gridSize;
            canvas.fire('object:scaled', { target: obj });
        }
        obj.setCoords();
        canvas.renderAll();
    });
    basicKeybind('s', state => {
        if (!state) return;
        let obj = canvas.getActiveObject();
        if (!obj) return;
        if (!isKeyPressed(' ')) {
            obj.top += canvas.gridSize;
        } else {
            obj.height += canvas.gridSize;
            canvas.fire('object:scaled', { target: obj });
        }
        obj.setCoords();
        canvas.renderAll();
    });
    basicKeybind('a', state => {
        if (!state) return;
        let obj = canvas.getActiveObject();
        if (!obj) return;
        if (!isKeyPressed(' ')) {
            obj.left -= canvas.gridSize;
        } else {
            obj.width += canvas.gridSize;
            obj.left -= canvas.gridSize;
            canvas.fire('object:scaled', { target: obj });
        }
        obj.setCoords();
        canvas.renderAll();
    });
    basicKeybind('d', state => {
        if (!state) return;
        let obj = canvas.getActiveObject();
        if (!obj) return;
        if (!isKeyPressed(' ')) {
            obj.left += canvas.gridSize;
        } else {
            obj.width += canvas.gridSize;
            canvas.fire('object:scaled', { target: obj });
        }
        obj.setCoords();
        canvas.renderAll();
    });
    */

    const gridSize = gSize || getElemValue('bgrid', 'int');

    getElem('editor').style.display = 'flex';
    getElem('config').style.display = 'flex';
    getElem('creation').style.display = 'none';

    canvas.gridSize = gridSize;

    window.shapes = [];
    window.props = [];
    window.propTypes = {};

    // create grid
    let gridLines = [];
    for (var i = 0; i < (cw / gridSize); i++) {
        let line = new fabric.Line([i * gridSize, 0, i * gridSize, ch], {
            stroke: '#000',
            selectable: false,
            strokeWidth: 2,
        });
        gridLines.push(line);
    }
    for (var i = 0; i < (ch / gridSize); i++) {
        let line = new fabric.Line([0, i * gridSize, cw, i * gridSize], {
            stroke: '#000',
            selectable: false,
            strokeWidth: 2,
        });
        gridLines.push(line);
    }

    let greenbg = new fabric.Rect({
        width: cw,
        height: ch,
        fill: '#2d570b',
        opacity: 1,
        centeredRotation: true,
        selectable: false,
        hoverCursor: 'default'
    });
    canvas.add(greenbg);
    let grid = new fabric.Group(gridLines, {
        selectable: false,
        opacity: 0.25,
        hoverCursor: 'default'
    });
    canvas.add(grid);

    const buildName = bName || getElemValue('bname', 'string');
    getElem('exportjson').onclick = () => ExportJSON();
    const ExportJSON = () => {
        let relPos = getElem('center').checked;
        let sizeRelativeToGrid = getElem('sizegrid').checked;
        let groupCoords = getElem('groupcoords').checked;
        let mainObject = {
            editorSettings: {
                name: buildName,
                gridSize,
                posRelativeCenter: relPos,
                sizeRelativeToGrid,
                groupCoords,
                props: [],
                propTypes,
            },
            width: cw,
            height: ch,
            shapes: []
        }

        shapes.forEach(shape => {
            let bullet = undefined;
            switch (shape.shapeType) {
                case 'red':
                    bullet = false;
                    break;
                case 'green':
                    bullet = true;
                    break;
            }
            mainObject.shapes.push(
                {
                    shape: shape.item(0).type,
                    width: shape.width,
                    height: shape.height,
                    bullet,
                    angle: degToRad(shape.angle),
                    position: {
                        x: relPos ? shape.left + shape.width / 2 - cw / 2 : shape.left,
                        y: relPos ? shape.top + shape.height / 2 - ch / 2 : shape.top
                    }
                }
            )
        });
        props.forEach(prop => {
            mainObject.editorSettings.props.push(
                {
                    propType: prop.propType,
                    source: prop.source,
                    width: prop.width,
                    height: prop.height,
                    angle: degToRad(prop.angle),
                    position: {
                        x: relPos ? prop.left + prop.width / 2 - cw / 2 : prop.left,
                        y: relPos ? prop.top + prop.height / 2 - ch / 2 : prop.top
                    }
                }
            )
        });
        if (mainObject.editorSettings.sizeRelativeToGrid) {
            mainObject.shapes.forEach(group => {
                group.width /= mainObject.editorSettings.gridSize;
                group.height /= mainObject.editorSettings.gridSize;
                group.position.x /= mainObject.editorSettings.gridSize;
                group.position.y /= mainObject.editorSettings.gridSize;
            });

            mainObject.editorSettings.props.forEach(prop => {
                prop.width /= mainObject.editorSettings.gridSize;
                prop.height /= mainObject.editorSettings.gridSize;
                prop.position.x /= mainObject.editorSettings.gridSize;
                prop.position.y /= mainObject.editorSettings.gridSize;
            });
        };
        if (!mainObject.editorSettings.groupCoords) {
            mainObject.shapes.forEach(group => {
                group.x = group.position.x;
                group.y = group.position.y;
                delete group.position;
            });

            mainObject.editorSettings.props.forEach(prop => {
                prop.x = prop.position.x;
                prop.y = prop.position.y;
                delete prop.position;
            });
        };

        let exported = JSON.stringify(mainObject);

        getElem('exported').value = exported;
        console.log(exported);
        alert('Export successful!')
    }

    getElem('exportpng').onclick = () => ExportPNG();
    const ExportPNG = () => {
        let keepProcess = confirm('You have started the png export process, would you like to continue?');
        if (!keepProcess) return;
        let keepBg = confirm('Would you like to keep the background in the final exported image?');
        //let keepRef = confirm('Would you like to keep the reference image in the final exported image?');
        let keepgrid = confirm('Would you like to keep the grid in the final exported image?');
        //if (!keepRef && bgImage) bgImage.visible = false;
        if (!keepgrid) grid.visible = false;
        if (!keepBg) greenbg.visible = false;
        let data = canvas.toDataURL();
        let bloburl = dataUrlToBlobUrl(data);
        window.open(bloburl, '_blank');
        alert('Image exported, if a window did not open make sure to enable pop-ups and try again!');
        //if (!keepRef && bgImage) bgImage.visible = true;
        if (!keepgrid) grid.visible = true;
        if (!keepBg) greenbg.visible = true;
    }

    window.addPropType = (type, imgUrl) => {
        let curType = type || getElem('cPropName').value;
        let curUrl = imgUrl || getElem('cPropUrl').value;
        if (curType === '' || typeof (curType) === 'undefined' || curType === null) return alert('Invalid prop name')
        if (curUrl === '' || typeof (curUrl) === 'undefined' || curUrl === null) return alert('Invalid prop url')
        for (const i in propTypes) {
            if (i === curType) return alert('This prop name has been used already')
        }
        propTypes[curType] = curUrl;

        //* HTML shit
        let holderDiv = getElem('propTypeHolder');

        let mainDiv = document.createElement('div');
        mainDiv.style.display = 'flex';
        mainDiv.style.justifyContent = 'space-evenly';

        let nameInput = document.createElement('input');
        nameInput.classList.add('input');
        nameInput.disabled = true;
        nameInput.style.width = '70px';
        nameInput.style.margin = '0px';
        nameInput.value = curType;

        let addToScene = document.createElement('button');
        addToScene.classList.add('sbutton');
        addToScene.style.width = '80px';
        addToScene.style.margin = '0px';
        addToScene.innerHTML = 'Add Prop';
        addToScene.onclick = () => {
            addProp(canvas, curType, curUrl);
        }

        let removeType = document.createElement('button');
        removeType.classList.add('sbutton');
        removeType.style.width = '100px';
        removeType.style.margin = '0px';
        removeType.innerHTML = 'Remove Type';
        removeType.onclick = () => {
            delete propTypes[curType];

            props = props.filter((prop) => {
                if (prop.propType === curType) {
                    canvas.remove(prop);
                    return false;
                } else {
                    return true;
                }
            });
        }

        mainDiv.append(nameInput, addToScene, removeType);
        holderDiv.appendChild(mainDiv);

        let pHHolder = getElem('propHeightHolder');
        if (pHHolder.style.height) {
            pHHolder.style.height = `${pHHolder.offsetHeight + mainDiv.offsetHeight}px`;
        }
    }
    getElem('addCurrentProp').onclick = () => addPropType();

    getElem('addSquare').onclick = () => addSquare(canvas);
    canvas.on({
        'object:rotating': options => {
            switch (options.target.type) {
                case 'group':
                    if (!settings.current.snapRotation) return;
                    let amt = settings.current.snapRadius || 15;
                    options.target.rotate(Math.round(options.target.angle / amt) * amt);
                    break;
                case 'image':
                    options.target.rotate(Math.round(options.target.angle / 90) * 90);
                    break;
            }
        },
        'object:selected': (t) => {
            window.selected = t.target;
        }
    });

    return canvas;
}

const addSquare = (c, left, top, width, height) => {
    let rect = new fabric.Rect({
        width: width || c.gridSize,
        height: height || c.gridSize,
        fill: '#000',
        opacity: 0.3,
        originX: 'center',
        originY: 'center',
        centeredRotation: true,
    });
    let outline = new fabric.Rect({
        width: rect.width,
        height: rect.height,
        fill: 'rgba(0,0,0,0)',
        stroke: '#000',
        strokeWidth: 2,
        opacity: 1,
        originX: 'center',
        originY: 'center',
        centeredRotation: true,
    });

    let x = left >= 0 ? left : rect.width;
    let y = top >= 0 ? top : rect.height;

    let mainShape = new fabric.Group([rect, outline], {
        left: x,
        top: y,
        originX: 'left',
        originY: 'top',
        centeredRotation: true,
        noScaleCache: false,
        lockSkewingX: true,
        lockSkewingY: true,
        opacity: settings.getKey('oOpacity') || 1,
    });
    let shapeTypes = ['blue', 'red', 'green'];
    mainShape.changeType = (type) => {
        mainShape.shapeType = type;
        switch (type) {
            case 'red':
                mainShape.item(0).set('fill', '#ff1e12');
                mainShape.item(1).set('stroke', '#ff1e12');
                break;
            case 'blue':
                mainShape.item(0).set('fill', '#2062fa');
                mainShape.item(1).set('stroke', '#2062fa');
                break;
            case 'green':
                mainShape.item(0).set('fill', '#1ddb26');
                mainShape.item(1).set('stroke', '#1ddb26');
                break;
        }
        c.renderAll();
    }
    mainShape.changeType(shapeTypes[0]);
    mainShape.cycleType = (direction) => {
        let length = shapeTypes.length;
        let nextI = shapeTypes.indexOf(mainShape.shapeType) + direction;
        if (length <= nextI) {
            nextI = 0;
        } else if (nextI < 0) {
            nextI = shapeTypes.length - 1;
        }
        mainShape.changeType(shapeTypes[nextI]);
    }
    shapes.push(mainShape);
    mainShape.on('mousedown', (e) => {
        if (e.button === 3) {
            shapes.splice(shapes.indexOf(mainShape), 1);
            c.remove(mainShape);
        };
    });

    c.bitchMode = true;
    c.fire('object:scaled', { target: mainShape });
    c.bitchMode = false;

    c.add(mainShape);
    c.bringToFront(mainShape);
    c.setActiveObject(mainShape);

    return mainShape;
}

const addProp = (c, type, src, reqGrid = 50, left, top, angle) => {
    let mainProp = fabric.Image.fromURL(src, function (mainImage) {
        mainImage.selectable = false;
        mainImage.hoverCursor = 'default';
        let ratio = c.gridSize / reqGrid;

        mainImage.source = src;
        mainImage.propType = type;

        mainImage.set({
            left: left || canvas.width / 2,
            top: top || canvas.height / 2,
            angle: angle || 0,
            originX: 'left',
            originY: 'top',
            scaleX: ratio,
            scaleY: ratio,
            lockSkewingX: true,
            lockSkewingY: true
        });

        props.push(mainImage);

        mainImage.on('mousedown', (e) => {
            if (e.button === 3) {
                props.splice(props.indexOf(mainImage), 1);
                c.remove(mainImage);
            };
        });

        c.bitchMode = true;
        c.fire('object:scaled', { target: mainImage });
        c.bitchMode = false;
        c.fire('object:moving', { target: mainImage });

        c.add(mainImage);
        c.sendToBack(mainImage);
        c.bringForward(mainImage);
        c.bringForward(mainImage);
        c.setActiveObject(mainImage);
    }, { crossOrigin: 'anonymous' });
}
