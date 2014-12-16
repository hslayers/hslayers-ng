#!/usr/bin/env python

"""This is a blind proxy that we use to get around browser
restrictions that prevent the Javascript from loading pages not on the
same server as the Javascript.  This has several problems: it's less
efficient, it might break some sites, and it's a security risk because
people can use this proxy to browse the web and possibly do bad stuff
with it.  It only loads pages via http and https, but it can load any
content type. It supports GET and POST requests.

.. attribute:: allowedHosts

    list of allowed hosts or None

.. attribute:: encodings

    list of supported encodings for conversion

"""

import urllib2, urlparse, httplib
import cgi
import sys, os
import re
import logging

#loglevel
LEVEL = logging.DEBUG

# allowedHosts = ['www.openlayers.org', 'openlayers.org']
allowedHosts = None

# list of encodings, which will be used for conversion, when the input is
# not text/xml mimetype
encodings = ["utf-8","windows-1250","iso-8859-2","iso-8859-1","windows-1251"]

def encode(data,toEncoding,contentType):
    """encode downloaded text to some other requested encoding
    :param data: string object
    :param contentType: content type of the output
    :returns: converted string
    """

    # try for each supported encoding
    for encoding in encodings:
        logging.debug("Trying to convert from %s to %s" % (encoding,toEncoding))
        regx = re.compile(encoding,re.IGNORECASE)
        fromEncoding = re.search(regx,data)
        logging.debug("Looking after %s: %s" % (encoding,fromEncoding))
        try:
            # read the data in given encoding, convert to target encoding
            # replace potential encoding name in the data
            if contentType == "text/xml" and fromEncoding:
                logging.debug("Converting text/xml from %s to %s" % (encoding,toEncoding))
                return regx.sub(toEncoding,data.decode(encoding).encode(toEncoding))
            elif not contentType == "text/xml":
                logging.debug("Trying to convert %s from %s to %s" % (contentType,encoding,toEncoding))
                # do not replace anything, just make the conversion
                return data.decode(encoding).encode(toEncoding)
        except:
            pass

    # nothing was returned and so we end up here, raise error
    logging.warning("Could not convert data to target encoding [%s], tryed one of %s" %\
            (toEncoding,encodings))

    return data

def main():
    """request the data from remote serser, based on POST or GET request
    possibly make the encoding conversion"""

    method = os.environ["REQUEST_METHOD"]
    toEncoding = None

    # read the data from POST request
    if method == "POST" or\
            method == "PUT" or \
            method == "DELETE":
        qs = os.environ["QUERY_STRING"]
        d = cgi.parse_qs(qs)
        if d.has_key("url"):
            url = d["url"][0]
        else:
            url = "http://www.hsrs.cz"

        if "toEncoding" in d:
            toEncoding = d["toEncoding"][0]

    # read the data from GET request
    elif method == "GET":
        fs = cgi.FieldStorage()
        url = fs.getvalue('url')
        toEncoding = fs.getvalue('toEncoding', None)
    try:
        host = url.split("/")[2]

        if not url.startswith("http"):
            url = "http://%s/%s" % (os.environ["SERVER_NAME"],url)



        if allowedHosts and not host in allowedHosts:
            print "Status: 502 Bad Gateway"
            print "Content-Type: text/plain"
            print
            print "This proxy does not allow you to access that location (%s)." % (host,)
            print
            print os.environ

        elif url.startswith("http://") or url.startswith("https://"):

            # open the request object
            body = None
            if method == "POST":
                length = int(os.environ["CONTENT_LENGTH"])
                #headers = {"Content-Type": os.environ["CONTENT_TYPE"]}
                #headers = {"Content-Type": "application/vnd.ogc.sld+xml"}
                body = sys.stdin.read(length)
                #r = urllib2.Request(url, body, headers)
                #y = urllib2.urlopen(r)
            elif method == "PUT":
                length = int(os.environ["CONTENT_LENGTH"])
                body = sys.stdin.read(length)
                #import requests
                #r = requests.put(url,data=body)
            #elif method == "DELETE":
            #    #import requests
            #    #r = requests.get(url,data=body)
            #else:
            #    #y = urllib2.urlopen(url)

            o = urlparse.urlparse(url)
            conn = httplib.HTTPConnection(o.netloc)
            req = o.path+"?"+o.query
            if o.fragment:
                req += "#"+o.fragment
            conn.request(method,req)
            resp = conn.getresponse()


            content_type = resp.getheader("Content-type")
            # convert any *xml* content type to "text/xml", so that
            # browsers can parse it easy.
            # this applyes especially to something like
            # application/vnd.ogc.wms_xml, produced by UMN MapServer
            if content_type and \
               (content_type.find("xml") > -1 or\
               content_type.find("gml") > -1):
                logging.debug("%s Content-Type set to text/xml" % content_type)
                print "Content-Type: text/xml"
                content_type = "text/xml"
            else:
                logging.debug("Content-Type set to %s" % content_type)
                print "Content-Type: %s" % content_type

            print

            # convert file encoding
            if toEncoding:
                print encode(resp.read(),toEncoding,content_type)
            else:
                print resp.read()

            resp.close()
        else:
            print "Content-Type: text/plain"
            print
            print "Illegal request."

    except Exception, E:
        print "Status: 500 Unexpected Error"
        print "Content-Type: text/plain"
        print
        print "Some unexpected error occurred. Error text was:", E


if __name__ == "__main__":
    logging.basicConfig(level=LEVEL)
    main()

