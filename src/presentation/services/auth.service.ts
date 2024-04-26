import { BcryptAdapter, JwtAdapter, envs } from "../../config";
import { UserModel } from "../../data";
import { CustomError } from "../../domain";
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto";
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto";
import { UserEntity } from "../../domain/entities/user.entity";
import { EmailService } from "./email.service";


export class AuthService {

    //DI
    constructor(
        private readonly emailService: EmailService,
    ) { }

    public async registerUser(registerUserDto: RegisterUserDto) {
        const userExists = await UserModel.findOne({ email: registerUserDto.email });
        if (userExists) throw CustomError.badRequest('Email already exists');

        try {
            const user = new UserModel(registerUserDto);

            // Encriptar password
            user.password = BcryptAdapter.hash(registerUserDto.password);

            await user.save();

            // JWT para mantener la auth del usuario

            // Confirmation email
            await this.sendEmailValidationLink(user.email);

            const { password, ...userEntity } = UserEntity.fromObject(user);

            const token = await JwtAdapter.generateToken({ id: user.id });
            if (!token) throw CustomError.internalServer('Error while generating JWT');

            return {
                user: userEntity,
                token: token,
            };

        } catch (error) {
            throw CustomError.internalServer(`${error}`);
        }

    }

    public async loginUser(loginUserDto: LoginUserDto) {

        const userExists = await UserModel.findOne({ email: loginUserDto.email });
        //if (!userExists) throw CustomError.badRequest('User does not exist');
        if (!userExists) throw CustomError.badRequest('Incorrect credentials');

        // Match
        const compareResult = BcryptAdapter.compare(loginUserDto.password, userExists.password);
        if (!compareResult) throw CustomError.badRequest('Incorrect credentials');

        const { password, ...user } = UserEntity.fromObject(userExists);

        const token = await JwtAdapter.generateToken({ id: userExists.id });
        if (!token) throw CustomError.internalServer('Error while generating JWT');

        return {
            user: { ...user },
            token: token,
        }
    }

    private sendEmailValidationLink = async (email: string) => {

        const token = await JwtAdapter.generateToken({ email });
        if (!token) throw CustomError.internalServer('Error generating JWT');

        const link = `${envs.WEB_SERVICE_URL}/auth/validate-email/${token}`;
        const html = `
        <h1> Validate your email </h1>
        <p> Click on the following link to validate your email </p>
        <a href="${link}"> Validate your email </a>
        `;

        const options = {
            to: email,
            subject: 'Validate your email',
            htmlBody: html,
        }

        const isSent = await this.emailService.sendEmail(options);
        if (!isSent) throw CustomError.internalServer('Error sending email');

    }

    public validateEmail = async (token: string) => {

        const payload = await JwtAdapter.validateToken(token);
        if (!payload) throw CustomError.unauthorized('Invalid token');

        const { email } = payload as { email: string };
        if (!email) throw CustomError.internalServer('Email not in token');

        const user = await UserModel.findOne({ email });
        if (!user) throw CustomError.internalServer('Emial does not exist');

        user.emailValidated = true;
        await user.save();

        return true;

    }


}