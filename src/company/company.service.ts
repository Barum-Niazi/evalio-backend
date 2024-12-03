import { Injectable } from '@nestjs/common';

@Injectable()
export class CompanyService {
  addEmployee(name, email, companyId) {
    // randomly generate the password
    const password = Math.random().toString(36).slice(-8);

    // send an email to the user with the password
    // sendEmail(email, password);

    // create the employee
  }
}
