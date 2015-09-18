#!/bin/bash
# Description: This script is run by Travis CI on successful builds in order to
# update the repo's GitHub pages with JSDoc documentation.
set -e

user='twilio'
repo='ortc-adapter'

if [[ "${TRAVIS_REPO_SLUG}" == "${user}/${repo}" \
   && "${TRAVIS_PULL_REQUEST}" == 'false' \
   && "${TRAVIS_BRANCH}" == 'master' \
   && ! -z "${JSDOC_KEY}" ]]
then

  echo "Generating JSDoc documentation..."
  make docs
  cp -R dist/docs ${HOME}/docs

  echo "Cloning repo..."
  cd ${HOME}
  git config --global user.email 'travis@travis-ci.org'
  git config --global user.name 'travis-ci'
  git clone --quiet --branch=gh-pages \
    https://${JSDOC_KEY}@github.com/${user}/${repo} gh-pages >/dev/null

  echo "Updating repo..."
  cd gh-pages
  rm -rf *
  mv ../docs/* .
  git add -f .
  git commit -m "Updating JSDoc documentation (${TRAVIS_BUILD_NUMBER})"
  git push -fq origin gh-pages >/dev/null

  echo "Published JSDoc documentation."

fi
