import { CLIENT_USER_TYPE, PROVIDER_USER_TYPE } from '../constants/index.js'

export class UsersRepository {
  users = [
    { id: '1', name: 'Dr. Jim', userType: PROVIDER_USER_TYPE },
    { id: '2', name: 'Bob', userType: CLIENT_USER_TYPE },
    { id: '3', name: 'Dr. Jane', userType: PROVIDER_USER_TYPE },
  ]

  findUserById(id) {
    return this.users.find((user) => user.id === id)
  }
}
