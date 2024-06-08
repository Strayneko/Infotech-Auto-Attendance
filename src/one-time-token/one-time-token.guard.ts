import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class OneTimeTokenGuard implements CanActivate {
  private readonly initVectorKey: string;
  private readonly encryptionService: EncryptionService;
  public constructor() {
    this.encryptionService = new EncryptionService();
    this.initVectorKey = process.env.INIT_VECTOR_KEY;
  }

  public canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (process.env.NODE_ENV !== 'production') return true;

    const request = context.switchToHttp().getRequest();
    const appToken = request.headers['x-app-token'];
    const requestTime = request.headers['x-request-time'];
    if (appToken === undefined || appToken?.length === 0) {
      throw new UnauthorizedException('No app token provided.');
    }

    const tokenFormula =
      process.env.FRONTEND_HOST +
      request.path +
      request.headers['user-agent'] +
      requestTime +
      this.initVectorKey +
      JSON.stringify(request.body || {});
    const token = this.encryptionService.encryptSync(tokenFormula);
    if (token !== appToken) {
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }
}
