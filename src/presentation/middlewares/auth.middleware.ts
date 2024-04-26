import { NextFunction, Request, Response } from "express";
import { JwtAdapter } from "../../config";
import { UserModel } from "../../data";
import { UserEntity } from "../../domain/entities/user.entity";

export class AuthMiddleware {

    // No se necesita DI, no es necesario el constructor

    static async validateJWT(req: Request, res: Response, next: NextFunction) {

        const authorization = req.header('Authorization');
        if (!authorization) return res.status(401).json({ error: 'Not authorized' });
        if (!authorization.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authorized' });

        const token = authorization.split(' ').at(1) || ''; // .at(1) = [1]

        try {

            const payload = await JwtAdapter.validateToken<{ id: string }>(token);
            if (!payload) return res.status(401).json({ error: 'Unauthorized' });

            const user = await UserModel.findById(payload.id);
            if (!user) return res.status(400).json({ error: 'Invalid token - user' });

            req.body.user = UserEntity.fromObject(user);

            next();


        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Internal Server error' });
        }
    }

}