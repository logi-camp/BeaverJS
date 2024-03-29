import { Element } from 'domhandler/lib'
import { nanoid } from 'nanoid'
import BVRElement, { appendElFromTemplate } from '..'

export default class IfDirective {
    constructor(private bvrElement: BVRElement) {}

    static tagName = 'if'

    render(templateEl: Element, scope: Record<string, any>, parentScopeId: string) {
        const tEl = templateEl as Element
        let element: (HTMLElement | Comment)[] = []

        const vars = [
            ...(tEl.attribs['exp']
                .match(/(let|const|var)( |	|\n)+([a-zA-Z]|\$|_)+/g)
                ?.map((v) => v.replace(/(let|const|var)( |	|\n)/g, '')) || []),
            ...Object.keys(scope),
        ]?.join(',')

        const exp = tEl.attribs['exp'].replace(/this(.\w)+/, ($propStr) => {
            const propTrimmed = $propStr.replace('this.', '')

            this.bvrElement.addSubscribe(propTrimmed, () => set(), parentScopeId)
            return $propStr.replace(/this./, 'that.')
        })
        const code = `
                    const {${scope && Object.keys(scope).join(',')}} = ${JSON.stringify(scope)}
                    var that = this;

                    if( ${exp} ){
                        return tEl.children.map((tChild)=>{
                            return appendElFromTemplate(those, tChild, elem, {${vars}}, scopeId)
                        })
                    }else {
                        return []
                    }
                `

        const args = ['appendElFromTemplate,those,tEl,elem,scopeId', code]

        let lastId: string | undefined
        const set = () => {
            if (lastId) {
                this.bvrElement.removeSubscribeByClass(lastId)
            }

            function getComments(context: HTMLElement) {
                var foundComments: Comment[] = []
                var elementPath: (ChildNode | undefined)[] = [context]
                while (elementPath.length > 0) {
                    var el = elementPath.pop()
                    for (var i = 0; i < (el?.childNodes.length || 0); i++) {
                        var node = el?.childNodes[i]
                        if (node?.nodeType === Node.COMMENT_NODE && node instanceof Comment) {
                            foundComments.push(node)
                        } else {
                            elementPath.push(node)
                        }
                    }
                }

                return foundComments
            }

            let start: Comment | undefined
            let end: Comment | undefined

            const $scopeId = nanoid(6)
            let first = false
            if (!lastId) {
                first = true
                lastId = $scopeId
                start = document.createComment('if:' + $scopeId)
                end = document.createComment('endif:' + $scopeId)
                element = [start, end]
            } else {
                start = getComments(this.bvrElement.$$rootElement).find(
                    (cmnt) => cmnt.nodeValue === 'if:' + lastId
                )
                end = getComments(this.bvrElement.$$rootElement).find(
                    (cmnt) => cmnt.nodeValue === 'endif:' + lastId
                )
                //let cursor = start?.nextSibling
                while (start?.nextSibling !== end && start?.nextSibling) {
                    start?.parentElement?.removeChild(start?.nextSibling)
                }
            }

            try {
                const fn = Function.apply(null, args)
                //const elems = [document.createComment('if:' + $scopeId)]
                const elems = fn.bind(this.bvrElement)(
                    appendElFromTemplate,
                    this.bvrElement,
                    tEl,
                    undefined,
                    $scopeId
                ) as HTMLElement[]
                //elems.push(document.createComment('endif:' + $scopeId))
                if (first) {
                    element = [element[0], ...elems, element[1]]
                } else {
                    const h = (
                        endElement: Comment,
                        element: HTMLElement | Comment | (HTMLElement | Comment)[]
                    ) => {
                        if (!Array.isArray(element)) {
                            endElement.before(element)
                        } else {
                            element.forEach((el) => {
                                h(endElement, el)
                            })
                        }
                    }
                    if (end) h(end, elems)
                }
            } catch (e) {
                console.error(e)
                element = []
            }
        }

        set()
        return element
    }
}
