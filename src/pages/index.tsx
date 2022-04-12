import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link'
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { FiUser, FiCalendar } from 'react-icons/fi';
import { useEffect, useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface Posts {
  results: Post[]
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results)
  const [nextPage, setNextPage] = useState(postsPagination.next_page)
  
  async function handleGetPosts(): Promise<void> {
    const results = await fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        setNextPage(data.next_page)
        const results = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });
        return results
      })
      .catch(err => {
        console.error(err);
      });
    
    setPosts([...posts, ...results]);
  }

  return (  
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <section className={styles.postsContainer}>
        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a className={styles.post}>
              <h2>{post.data.title}</h2>
              <p>{post.data.subtitle}</p>
              <div className={styles.info}>
                <div>
                  <FiCalendar size={20} />
                  <p>{format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        { 
                          locale: ptBR
                        }
                      )}</p>
                </div>
                <div>
                  <FiUser size={20} />
                  <p>{post.data.author}</p>
                </div>
              </div>
            </a>
          </Link>
          
        ))}
        
      {nextPage ?
          (
            <a className={styles.loadButton} onClick={handleGetPosts}>Carregar mais posts</a>
          ) : null}
      </section>

    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.first_publication_date', 'posts.author'],
    pageSize: 2,
  });

  const postsPagination = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsPagination
      }
    }
  }

};
