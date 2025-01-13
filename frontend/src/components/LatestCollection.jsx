import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import ProductItem from './ProductItem';

const LatestCollection = () => {
    const {products} = useContext(ShopContext);
    const [bestProducts, SetBestProducts] = useState([]);
    useEffect(()=>{
        SetBestProducts(products.slice(0,6));
    },[])
  return (
    <div>
        <div className='text-center py-8 text-3xl'>
            <Title text1 = {'Best'} text2 = {'Collections'}/>
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'>
            {bestProducts.map((item,index)=>(
                <ProductItem key={index} id={item._id} image={item.image} name={item.name} />
            ))}
        </div>
    </div>
  )
}

export default LatestCollection
