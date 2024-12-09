export class Usuario {
    id!: number;
    //mail
    username: string = '';
    nombre: string = '';
    lastname: string = '';
    password: string= '';
    dni: string = '';
    organizacion: string = '';
    titulo: string = '';
    matriculaProvincia: string = '';
    matriculaColegioNeuquen: string = '';
    matriculaMunicipal: string = '';
    address: string = '';
    phone: string = '';
    role: string = '';
 
    constructor(init?: Partial<Usuario>) {
        Object.assign(this, init);
    }
}
