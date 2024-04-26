import { Request, Response } from "express";
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto";
import { AuthService } from "../services/auth.service";
import { CustomError } from "../../domain";
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto";

export class AuthController {

    // DI
    constructor(
        public readonly authService: AuthService,
    ) { }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        console.log(`${error}`);
        return res.status(500).json({ error: 'Internal Server error' });
    }

    registerUser = async (req: Request, res: Response) => {
        const [error, registerDto] = RegisterUserDto.create(req.body);

        if (error) return res.status(400).json({ error });

        try {
            const registerResponse = await this.authService.registerUser(registerDto!);
            res.json(registerResponse);
        } catch (error) {
            // Manejo del error
            this.handleError(error, res);
        }

        /*this.authService.registerUser(registerDto!)
            .then(user => res.json(user));
        //.catch()*/

    }

    loginUser = async (req: Request, res: Response) => {
        const [error, loginDto] = LoginUserDto.create(req.body);

        if (error) return res.status(400).json({ error });

        try {
            const loginResponse = await this.authService.loginUser(loginDto!);
            res.json(loginResponse);
        } catch (error) {
            this.handleError(error, res);
        }
    }

    validateEmail = async (req: Request, res: Response) => {
        const { token } = req.params;

        /*this.authService.validateEmail(token)
            .then(() => res.json('Email validated successfully'))
            .catch(error => this.handleError(error, res));*/

        try {
            await this.authService.validateEmail(token);
            res.json('Email validated successfully')
        } catch (error) {
            //console.log(error);
            this.handleError(error, res);
        }
    }
}