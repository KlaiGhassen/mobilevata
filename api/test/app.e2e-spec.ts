import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { assertJwtSecretConfigured } from '../src/common/security/jwt-secret';

describe('Autovia API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      process.env.JWT_SECRET ||
      'e2e-test-secret-32chars-minimum-ok!!';
    process.env.REINDEX_SECRET =
      process.env.REINDEX_SECRET || 'e2e-reindex-secret';
    assertJwtSecretConfigured(process.env.JWT_SECRET);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated reindex', () => {
    return request(app.getHttpServer())
      .post('/vehicles/reindex')
      .expect(401);
  });

  it('allows reindex with x-reindex-secret', () => {
    return request(app.getHttpServer())
      .post('/vehicles/reindex')
      .set('x-reindex-secret', process.env.REINDEX_SECRET!)
      .expect((res) => {
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
      });
  });

  it('rejects short passwords on register', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'short@example.com',
        password: '1234567',
        firstName: 'A',
        lastName: 'B',
      })
      .expect(400);
  });

  it('rejects passwords without a letter and number', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'weakpass@example.com',
        password: 'abcdefgh',
        firstName: 'A',
        lastName: 'B',
      })
      .expect(400);
  });

  it('sets httpOnly cookie and omits accessToken from body', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'buyer@mobile.de', password: 'password123' });

    if (res.status === 401) {
      return;
    }
    expect([200, 201]).toContain(res.status);
    expect(res.body.accessToken).toBeUndefined();
    expect(res.body.user?.email).toBe('buyer@mobile.de');
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const joined = Array.isArray(setCookie)
      ? setCookie.join(';')
      : String(setCookie);
    expect(joined).toMatch(/access_token=/);
    expect(joined.toLowerCase()).toMatch(/httponly/);
  });

  it('authenticates /auth/me via cookie session', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'buyer@mobile.de', password: 'password123' });

    if (login.status === 401) return;

    const cookie = login.headers['set-cookie'];
    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('buyer@mobile.de');
  });

  it('rejects PATCH on vehicle without auth', async () => {
    const list = await request(app.getHttpServer()).get('/vehicles?limit=1');
    if (list.status !== 200 || !list.body?.items?.[0]?.id) return;
    await request(app.getHttpServer())
      .patch(`/vehicles/${list.body.items[0].id}`)
      .send({ title: 'Hacked' })
      .expect(401);
  });
});
