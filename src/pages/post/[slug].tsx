import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { FiClock, FiUser, FiCalendar } from 'react-icons/fi';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post( { post } : PostProps) {

  const router = useRouter()

  if(router.isFallback) {
    return <p>Carregando...</p>
  }

  const totalTime = post.data.content.reduce((acc, time) => {
    const total = RichText.asText(time.body).split(' ');

    const min = Math.ceil(total.length / 200);
    return acc + min;
  }, 0);

  return (
    <>
      <Head>
        <title> {post.data.title} | spacetraveling</title>
      </Head>

      <figure className={styles.banner}>
        <img src={post.data.banner.url} alt="logo" />
      </figure>

      <article className={styles.container}>
          <header className={styles.header}>
            <h1>{post.data.title}</h1>
            <div>
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
                <FiUser size={20}/>
                <p>{post.data.author}</p>
              </div>
              <div>
                <FiClock size={20} />
                <p>{totalTime} min</p>
              </div>
            </div>
          </header>

          {post.data.content.map(content => (
            <section key={content.heading} >
              <h2>{content.heading}</h2>
              {content.body.map(text => (
                <p key={text.text}>{text.text}</p>
              ))}
            </section>  
          ))}
          
      </article>
    </>  
  )
}

export const getStaticPaths : GetStaticPaths = async () => {
      const prismic = getPrismicClient();
      const posts = await prismic.query([
        Prismic.Predicates.at('document.type', 'posts')
      ], {
        fetch: ['posts.uid'],
        pageSize: 2,
      });
      const slugs = posts.results.map(post => {
        return {
          params: {
            slug: post.uid
          }
        }
      })
      return {
        paths: slugs,
        fallback: true
      }


};

export const getStaticProps : GetStaticProps = async ({ params}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});;
  
  const post = {
    uid: response.uid,
    first_publication_date: 
      response.first_publication_date,
    data: {
      ...response.data,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
