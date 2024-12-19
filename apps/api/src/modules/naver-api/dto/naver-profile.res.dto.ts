import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';
import { Gender } from '../../user/user.interface';

// {
//   "resultcode": "00",
//   "message": "success",
//   "response": {
//     "email": "openapi@naver.com",
//     "profile_image": "https://ssl.pstatic.net/static/pwe/address/nodata_33x33.gif",
//     "gender": "F",
//     "id": "32742776",
//     "name": "오픈 API",
//     "birthday": "10-01",
//     "birthyear": "1900",
//     "mobile": "010-0000-0000"
//   }
// }
export class NaverProfileResDto extends createZodDto(
  z.object({
    resultcode: z.string(),
    message: z.string(),
    response: z.object({
      email: z.string(),
      profile_image: z.string(),
      gender: z.nativeEnum(Gender),
      id: z.string(),
      name: z.string(),
      birthday: z.string(),
      birthyear: z.string(),
      mobile: z.string(),
    }),
  }),
) {}
