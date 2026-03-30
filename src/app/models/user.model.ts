import {Pet} from "./pet.model";

export interface User {
    id: string;
    email: string;
    name: string;
    fullName?: string;
    phone?: string;
    address?: string;
    profilePictureUrl?: string;
    socialProvider?: string;
    socialId?: string;

    pets?: Partial<Pet>[]; // ใช้ Partial เพื่อหลีกเลี่ยงข้อมูลซ้อนกันแบบลูป
    followers?: User[];
    following?: User[];
}
