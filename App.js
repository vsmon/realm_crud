import React, {Component} from 'react'
import {TextInput, View, Text, Button, FlatList, TouchableHighlight} from 'react-native'
import Realm from 'realm'
import firebase from './firebaseConnection'

export default class App extends Component{

  constructor(props){
    super(props)
    this.state = {
      pessoas:[],
      uid:'',      
      nome:'',
      idade:'',
      pessoaSchema : {
        name:'pessoas',
        properties:{
          id:'string',
          nome:'string',
          idade:'string',        
        }        
      }
    }

    const authentication = async() => {
      try {
        const user = await firebase.auth().signInWithEmailAndPassword('rodrigo@gmail.com', '123456')
        if(user){
          this.setState({...this.state, uid:firebase.auth().currentUser.uid})
        }
      } catch (error) {
        alert(error.message)
      }
    }
    authentication()

    const repeat = ()=>{
      setInterval(()=>{
        this.syncFirebase()
      }, 10000)
    }

    //repeat()
    
  }
  
  componentWillMount(){
    this.loadRealm()
  }
  componentWillUpdate(){
    //this.loadRealm()
  }

  salvar(){
    this.salvarRealm()
    this.loadRealm()
  }

  async syncFirebase(){
    try {    
      if(this.state.uid != ''){
        const {pessoas} = this.state

        await firebase.database().ref(this.state.uid).child('pessoas').remove()

        pessoas.map(async (pessoa) => {
          const key =  await firebase.database().ref(this.state.uid).child('pessoas').push()
          await key.set({
            id:pessoa.id,
            nome:pessoa.nome,
            idade:pessoa.idade,
          })
        })        
      }
    } catch (error) {
      alert(error.message)
    }
  }

  async salvarRealm(){
    try {
      const realm = await Realm.open({schema:[this.state.pessoaSchema]})          
      await realm.write(async()=>{
        await realm.create('pessoas',{
          id: Math.floor(Math.random() * 10000000).toString(),
          nome: this.state.nome,
          idade: this.state.idade,
        })
      })
      this.syncFirebase()

    } catch (error) {
      alert(error.message)
    }    
  }

  async loadRealm(){
    try {
      const realm = await Realm.open({schema:[this.state.pessoaSchema]})
      let pessoas = await realm.objects('pessoas')

      this.setState({...this.state, pessoas})

    } catch (error) {
      alert(error.message)
    }
  }
  
  async excluirTudo(){
    try {
      const realm = await Realm.open({schema:[this.state.pessoaSchema]})

      let pessoas = await realm.objects('pessoas')

      await realm.write(()=>{
        realm.delete(pessoas)
      })
      
    } catch (error) {
      alert(error.message)
    }
  }

  async excluirItem(id){
    try {
      const realm = await Realm.open({schema:[this.state.pessoaSchema]})

      let pessoas = await realm.objects('pessoas').filtered(`id == '${id}'`)

      await realm.write(()=>{
        realm.delete(pessoas)
      })

      this.loadRealm()
      
    } catch (error) {
      alert(error.message)
    }
  }

  render(){
    return(
      <View sytle={{flex:1}}>
        <TextInput
          placeholder='Nome...'
          onChangeText={(nome)=>this.setState({...this.state, nome})}
        />
        <TextInput
          placeholder='Idade...'
          onChangeText={(idade)=>this.setState({...this.state, idade})}
        />
        <Button
          title='Salvar'
          onPress={()=>this.salvar()}
        />
        <Button
          title='Excluir tudo'
          onPress={()=>this.excluirTudo()}
        />
        <FlatList
          data={this.state.pessoas}
          renderItem={({item})=>{
            return(
              <View style={{margin:10, borderWidth:1, flexDirection:'row'}}>
                <TouchableHighlight underlayColor='gray' style={{height:30}} onPress={()=>alert(item.nome)}>
                  <Text>ID: {item.id} Nome: {item.nome} Idade: {item.idade}</Text>                  
                </TouchableHighlight>                
                <TouchableHighlight onPress={()=>this.excluirItem(item.id)}>
                  <Text style={{fontSize:25, color:'red'}}>X</Text>
                </TouchableHighlight>                
              </View>            
            )            
            
          }}
          keyExtractor={(item)=>item.id.toString()}
        />
      </View>
    )
  }
}