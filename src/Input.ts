import { HTML, PHE } from './PHE'

export default class Input extends PHE {
    constructor() {
        super()
        console.log('-- this constructor invoked --')
    }

    mounted() {
        this.ctx.name = 'ok'
        // let counter = 0
        this.ctx.counter = 0
        // setInterval(() => {
        //     this.ctx.counter = counter
        //     counter++
        // }, 1000)
    }

    $$template = HTML`<div>{{this.ctx.counter}}pk</div>`
    
}
