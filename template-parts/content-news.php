<?php

/**
 *  Template name: Новость
 * 
 *  Template post type: post
 *
 * @package oceanwp

 */

?>

<main>
    <div class="wrapper">
        <div class="img">

        </div>
        <div class="test">

            <?php the_title('<h1 class="entry-title">', '</h1>'); ?>
            <div class="entry-content">
                <?php
                the_content(
                    sprintf(
                        wp_kses(
                            /* translators: %s: Name of current post. Only visible to screen readers */
                            __('Continue reading<span class="screen-reader-text"> "%s"</span>', 'them'),
                            array(
                                'span' => array(
                                    'class' => array(),
                                ),
                            )
                        ),
                        wp_kses_post(get_the_title())
                    )
                );

                wp_link_pages(
                    array(
                        'before' => '<div class="page-links">' . esc_html__('Pages:', 'them'),
                        'after'  => '</div>',
                    )
                );
                ?>
            </div>
        </div>
</main>