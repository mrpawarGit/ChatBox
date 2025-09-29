import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from './Layout'
import ChatList from '../page/ChatSection/ChatList'
import useStore from '../store/layoutStore'
import { getAllUsers } from '../services/user.service'
import { useChatStore } from '../store/chatStore'




export default function HomeScreen() {
    const setSelectedContact = useStore((state) => state.setSelectedContact)
    const [allUsers,setAllUsers] = useState([])
    const {messages} = useChatStore();
    
    const getUser = async() =>{
        try {
            const result = await getAllUsers();
            if(result.status==='success'){
                setAllUsers(result.data);
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() =>{
        getUser()
    },[messages])


    return (
        <Layout >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full"
            >
                <ChatList contacts={allUsers} setSelectedContact={setSelectedContact} />
            </motion.div>
        </Layout>
    )
}