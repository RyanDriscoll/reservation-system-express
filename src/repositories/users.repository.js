export const PROVIDER_USER_TYPE = 'provider'
export const CLIENT_USER_TYPE = 'client'

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
