export interface Program {
    name    : string
    text    : string[]
    color   : string
    duration: number
}

export interface Programs {
    active  : string
    programs: Program[]
}