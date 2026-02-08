import bcrypt from 'bcrypt';

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
}

const comparePassword = async (password, hashPassword) =>{
    return await bcrypt.compare(password, hashPassword);
}

export  {
    hashPassword,
    comparePassword
};
