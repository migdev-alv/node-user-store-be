import { genSaltSync, hashSync, compareSync } from 'bcryptjs'

export class BcryptAdapter {

    constructor() {

    }

    static hash(password: string) {
        const salt = genSaltSync();
        return hashSync(password, salt);
    }

    static compare(password: string, hashed: string) {
        return compareSync(password, hashed);
    }


}