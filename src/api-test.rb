
require 'net/http'
require 'json'
require 'pry'

url = 'https://secret-atoll-35147.herokuapp.com/menus/2016-11-07.json'
uri = URI(url)
response = Net::HTTP.get(uri)
object = JSON.parse(response)
binding.pry