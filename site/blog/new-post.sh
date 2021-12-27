post_date=`date -u -Iminutes | cut -d'+' -f1`
echo $post_date
slug=`echo "$*" | sed 's/ /-/g'`
echo $slug
touch "$post_date--$slug.md"
vim "$post_date--$slug.md"
