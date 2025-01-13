import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import ProductItem from "../components/ProductItem"

const BestSeller = () => {
    const {products} = useContext(ShopContext);
    const [bestSeller, setBestSeller] = useState([]);
    useEffect(() =>{
        const bestProduct = products.filter((item)=>(item.bestseller))
        setBestSeller(bestProduct.slice(0,6));}
    ,[]);
    console.log(bestSeller)
  return (
    <div className='my-10'>
        <div className='text-center text-3xl py-8'>
            <Title text1={'Top'} text2={'Picks'}/>
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'>
            {bestSeller.map((item,index)=>(
                <ProductItem key={index} id={item._id} image={item.image} name={item.name} />
            ))}
        </div>
    </div>
  )
}

export default BestSeller
