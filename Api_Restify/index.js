const { version, userInfo } = require('os')

const restify = require('restify');
const neo4j = require('neo4j-driver');
const driver = neo4j.driver("bolt://localhost:7687",neo4j.auth.basic("neo4j","151515"));
const session = driver.session();
var  uniqid = require('uniqid');         

//Criar servidor

const server = restify.createServer({
    name:'resty_api',
    version:'1.0.0',

});

//Porta 3000

server.listen(3000, ()=>{
    console.log('Api acessível na porta 3000')
});

//BodyParser

server.use(restify.plugins.bodyParser());

//Metodos

//List

const FindAll = async ()=>{
    result = await session.run("Match (u:Usuario) return u");
    return result.records.map(i=>i.get("u").properties);
}

//Find

const FindById= async (id)=>{
    const result = await session.run(`MATCH (u:Usuario {_id : '${id}'} ) return u limit 1`);
    return result.records[0].get('u').properties;
}

//Create

const Create = async (user)=>{
    const id_gerado = uniqid.time();
    await session.run(`CREATE (u:Usuario {_id : '${id_gerado}', nome: '${user.nome}', email: '${user.email}', senha: '${user.senha}'} ) return u`);
    return await FindById(id_gerado)
}

//Update

const Update = async (id,user)=>{
    const result = await session.run(`MATCH (u:Usuario {_id : '${id}'}) SET u.nome= '${user.nome}', u.email= '${user.email}', u.senha = '${user.senha}' return u`);
    return result.records[0].get('u').properties;
}

//Delete

const Delete = async (id)=>{
    await session.run(`MATCH (u:Usuario {_id : '${id}'}) DELETE u`);
    return await FindAll();
}

//Functions

//List

server.get('/usuarios',async (req,resp,next)=>{
    const result = await FindAll();
    resp.json(result);
    return next();
});

//Find

server.get('/usuarios/:id',async (req,resp,next)=>{
        const result = await FindById(req.params.id);
        if(result){
            resp.json(result);
        }else{
            resp.status(404);
            resp.json({message:'Não há este aluno'});
        }
        return next();
});       

//Insert

server.post('/usuarios',async (req,resp,next)=>{
    const result = await Create(req.body);
    if(result){
        resp.json(result);
    }else{
        resp.status(400);
        resp.json({message:error.message});
    }
    next();
});

//Update

server.put('/usuarios/:id', async (req,resp,next)=>{
    if(!req.is('application/json')){
      return next(new errors.InvalidContentError("Dados Invalidos na requisição"));
    }
    try{
        const result = await Update(req.params.id,req.body);
        resp.send(200);
        next();
    }catch(error){
        return next(new errors.ResourceNotFound("Item não encontrado"));
    }
});

//Delete

server.del('/usuarios/:id', async (req,resp,next)=>{
    try{
        const result = await Delete(req.params.id);
        resp.send(204);
        next();
    }catch(error){
        return next(new errors.ResourceNotFound("Item não encontrado"));
    }
});