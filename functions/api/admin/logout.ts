import { makeLogoutCookie } from './_lib';

export const onRequestPost: PagesFunction = async () => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': makeLogoutCookie(),
    },
  });
};
