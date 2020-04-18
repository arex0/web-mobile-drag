const ArrayMethods = Array.prototype
const hypot = (p1, p2) => Math.hypot(p1.pageX - p2.pageX, p1.pageY - p2.pageY)
const copyTouch = touch => ({ id: touch.identifier, pageX: touch.pageX, pageY: touch.pageY })
const findTouch = (touches, id) => ArrayMethods.find.call(touches, ({ identifier }) => identifier == id)
function on(ele,type,handle,opts){ele.addEventListener(type,handle,opts)}
function un(ele,type,handle,opts){ele.removeEventListener(type,handle,opts)}
function draggable(ele){
    let touch = null
    on(ele,'contextmenu',e=>e.preventDefault())
    on(ele,'touchstart',e=>{
        if (touch) return
        let cancel = false,
            u = e.changedTouches.length-1,
            tc = e.changedTouches[u]
        touch = copyTouch(tc)
        function cancelDrag(e){
            if(e.type!='touchstart'&&touch&&e.type=='touchmove'&&ArrayMethods.every.call(e.changedTouches,tc=>hypot(tc,touch)>50)) return
            cancel = true
            touch = null
        }
        on(document,'touchstart',()=>on(document,'touchstart',cancelDrag,{once:true}),{once:true})
        on(document,'touchmove',cancelDrag,{passive:false})
        on(document,'touchend',cancelDrag,{once:true})
        on(document,'touchcancel',cancelDrag,{once:true})
        setTimeout(()=>{
            un(document,'touchcancel',cancelDrag,{once:true})
            un(document,'touchend',cancelDrag,{once:true})
            un(document,'touchmove',cancelDrag,{passive:false})
            un(document,'touchstart',cancelDrag,{once:true})
            if(!cancel){
                let shadow = ele.cloneNode(true), style = shadow.style
                    src = ele.getBoundingClientRect(), srcX = src.x, srcY = src.y,
                    baseX = tc.pageX, baseY = tc.pageY,
                    data = new DataTransfer()
                Object.entries(getComputedStyle(ele)).forEach(([attr,val])=>{style[attr] = val})
                style.position = 'fixed'
                style.left = srcX+'px'
                style.top = srcY+'px'
                style.opacity = parseFloat(document.body.style.opacity||1) * 0.5
                style.pointerEvents = 'none'
                style.zIndex = 999
                document.body.appendChild(shadow)

                let target = null, overTimer = null, fireover = true
                function getElementByPoint(e){
                    let el = document.elementFromPoint(e.clientX, e.clientY)
                    while (el && getComputedStyle(el).pointerEvents == 'none') {
                        el = el.parentElement;
                    }
                    return el;
                }
                function dispatchEvent(e){
                    shadow.remove()
                    let t = getElementByPoint(e)
                    document.body.appendChild(shadow)
                    let init = {
                        screenX: e.screenX,
                        screenY: e.screenY,
                        clientX: e.clientX,
                        clientY: e.clientY,
                        pageX: e.pageX,
                        pageY: e.pageY,
                        dataTransfer: data
                    }
                    if(t!=target){
                        init.relatedTarget = target
                        t.dispatchEvent(new DragEvent('dragenter',init))
                        init.relatedTarget = t
                        target.dispatchEvent(new DragEvent('dragleave',init))
                        target = t
                        init.relatedTarget = null
                    }
                    clearInterval(overTimer)
                    target.dispatchEvent(new DragEvent('dragover',init))
                    overTimer = setInterval(()=>target.dispatchEvent(new DragEvent('dragover',init)),350)
                }
                function RenderDragMove(e){
                    ele.dispatchEvent(new DragEvent('drag',e))
                    shadow.style.left = srcX-baseX+e.pageX+'px'
                    shadow.style.top  = srcY-baseY+e.pageY+'px'
                }
                function DragMove(e){
                    let t = findTouch(e.changedTouches,touch.id)
                    if (t){
                        e.preventDefault()
                        e.stopPropagation()
                        requestAnimationFrame(()=>{
                            dispatchEvent(t)
                            RenderDragMove(t)
                        })
                    }
                }
                function DragEnd(e){
                    let t = findTouch(e.changedTouches,touch.id)
                    if(t&&(t.identifier==touch.id)){
                        touch = null
                        shadow.remove()
                        shadow = null
                        clearInterval(overTimer)
                        target.dispatchEvent(new DragEvent('drop',{
                            screenX: t.screenX,
                            screenY: t.screenY,
                            clientX: t.clientX,
                            clientY: t.clientY,
                            pageX: t.pageX,
                            pageY: t.pageY,
                            dataTransfer: data
                        }))
                        ele.dispatchEvent(new DragEvent('dragend',t))
                        un(document,'touchcancel',DragEnd)
                        un(document,'touchend',DragEnd)
                        un(document,'touchmove',DragMove,{passive:false})
                    }
                }
                ele.dispatchEvent(new DragEvent('dragstart', {
                    screenX: tc.screenX,
                    screenY: tc.screenY,
                    clientX: tc.clientX,
                    clientY: tc.clientY,
                    pageX: tc.pageX,
                    pageY: tc.pageY,
                    dataTransfer: data
                }))
                ele.dispatchEvent(new DragEvent('dragenter',tc))
                target = ele
                let evt = new DragEvent('dragover',{
                    screenX: e.screenX,
                    screenY: e.screenY,
                    clientX: e.clientX,
                    clientY: e.clientY,
                    pageX: e.pageX,
                    pageY: e.pageY,
                    dataTransfer: data
                })
                ele.dispatchEvent(evt)
                overTimer = setInterval(()=>ele.dispatchEvent(evt),350)
                on(document,'touchmove',DragMove,{passive:false})
                on(document,'touchend',DragEnd)
                on(document,'touchcancel',DragEnd)

            }
        },300)
    })
}
document.querySelectorAll('[draggable="true"]').forEach(draggable)